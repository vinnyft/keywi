-- ============================================================
-- Keywi — Migration 0009 : accès récurrents
--
-- Un prestataire qui revient chaque semaine (ménage du mardi,
-- jardinier du samedi…) ne devrait pas dépendre d'un code
-- regénéré à la main. L'hôte définit une récurrence ; Keywi
-- produit le code automatiquement avant chaque intervention et
-- l'envoie au prestataire.
--
-- Le code reste éphémère : il n'est valable que sur la fenêtre
-- de l'intervention, pas en permanence. C'est ce qui distingue
-- un accès récurrent d'un double de clé.
-- ============================================================

create table public.acces_recurrents (
  id                 uuid primary key default gen_random_uuid(),
  key_id             uuid not null references public.keys (id) on delete cascade,
  beneficiaire_nom   text,
  beneficiaire_email text,
  -- 0 = dimanche … 6 = samedi (convention extract(dow))
  jours_semaine      int[] not null check (array_length(jours_semaine, 1) between 1 and 7),
  heure_debut        time not null default '09:00',
  duree_heures       int  not null default 12 check (duree_heures between 1 and 72),
  actif              boolean not null default true,
  -- Occurrence déjà couverte par un code : garantit l'idempotence
  derniere_occurrence timestamptz,
  created_at         timestamptz not null default now()
);

create index idx_acces_recurrents_key on public.acces_recurrents (key_id);

alter table public.acces_recurrents enable row level security;

create policy "acces_recurrents : l'hôte gère ceux de ses clés"
  on public.acces_recurrents for all
  using (public.possede_cle(key_id))
  with check (public.possede_cle(key_id));

-- Les grants de 0002 ne couvrent pas les tables créées ensuite
grant select, insert, update, delete on public.acces_recurrents to authenticated;
grant select, insert, update, delete on public.acces_recurrents to service_role;

-- ------------------------------------------------------------
-- Prochaine occurrence d'une récurrence, à partir de maintenant.
-- Parcourt les 8 prochains jours et retient le premier qui tombe
-- un jour coché, à l'heure prévue, dans le futur.
-- ------------------------------------------------------------
create or replace function public.prochaine_occurrence(
  p_jours int[], p_heure time
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  v_candidat timestamptz;
  i int;
begin
  for i in 0..7 loop
    v_candidat := (current_date + i) + p_heure;
    if extract(dow from v_candidat)::int = any(p_jours) and v_candidat > now() then
      return v_candidat;
    end if;
  end loop;
  return null;
end;
$$;

-- ------------------------------------------------------------
-- Génère les codes des interventions à venir (fenêtre : 24 h).
-- Idempotente : une occurrence déjà servie n'est pas regénérée,
-- grâce à derniere_occurrence. Verrouillage FOR UPDATE SKIP
-- LOCKED pour supporter plusieurs exécutions concurrentes.
-- ------------------------------------------------------------
create or replace function public.generer_codes_recurrents()
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_ligne   record;
  v_occ     timestamptz;
  v_code    text;
  v_key     public.keys;
  v_relay   public.relay_points;
  v_hote    public.profiles;
  v_envois  jsonb := '[]'::jsonb;
  v_nb      int := 0;
begin
  for v_ligne in
    select * from public.acces_recurrents
    where actif
    for update skip locked
  loop
    v_occ := public.prochaine_occurrence(v_ligne.jours_semaine, v_ligne.heure_debut);

    -- Rien à faire si l'intervention est au-delà de 24 h ou déjà servie
    if v_occ is null or v_occ > now() + interval '24 hours' then
      continue;
    end if;
    if v_ligne.derniere_occurrence is not null and v_ligne.derniere_occurrence >= v_occ then
      continue;
    end if;

    select * into v_key from public.keys where id = v_ligne.key_id;
    if v_key.id is null or v_key.statut = 'perdue' then
      continue;
    end if;

    v_code := public.generer_code_retrait();

    insert into public.access_codes
      (key_id, code_6, qr_payload, beneficiaire_email, beneficiaire_nom, expire_at)
    values
      (v_key.id, v_code, 'KEYWI:' || v_code,
       v_ligne.beneficiaire_email, v_ligne.beneficiaire_nom,
       v_occ + (v_ligne.duree_heures || ' hours')::interval);

    -- Une clé déposée devient « prête au retrait »
    if v_key.statut = 'deposee' then
      update public.keys set statut = 'prete_retrait' where id = v_key.id;
    end if;

    update public.acces_recurrents
    set derniere_occurrence = v_occ
    where id = v_ligne.id;

    select * into v_relay from public.relay_points where id = v_key.relay_point_id;
    select * into v_hote  from public.profiles     where id = v_key.hote_id;

    v_envois := v_envois || jsonb_build_object(
      'beneficiaire_email', v_ligne.beneficiaire_email,
      'beneficiaire_nom',   v_ligne.beneficiaire_nom,
      'logement',           v_key.logement,
      'code_6',             v_code,
      'intervention_le',    v_occ,
      'commerce',           v_relay.nom,
      'adresse',            case when v_relay.id is null then null
                                 else v_relay.adresse || ', ' || v_relay.code_postal || ' ' || v_relay.ville end,
      'cle_en_depot',       v_key.statut in ('deposee', 'prete_retrait', 'retour'),
      'hote_email',         v_hote.email
    );
    v_nb := v_nb + 1;
  end loop;

  return jsonb_build_object('ok', true, 'nb_codes', v_nb, 'envois', v_envois);
end;
$$;

revoke execute on function public.generer_codes_recurrents() from public, anon, authenticated;
grant execute on function public.generer_codes_recurrents() to service_role;
