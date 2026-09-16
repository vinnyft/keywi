-- ============================================================
-- Keywi — Migration 0012 : limitation de débit
--
-- GoTrue limite déjà les tentatives par IP. Sauf que dans cette
-- architecture, l'authentification passe par les actions serveur
-- de Next.js : GoTrue ne voit jamais l'IP du visiteur, seulement
-- celle du serveur. Sa protection est donc inopérante — pire,
-- elle mettrait tous les utilisateurs dans le même seau.
--
-- La limitation doit donc vivre ici, là où l'IP réelle est
-- connue (en-tête X-Forwarded-For) et où le compteur est partagé
-- entre toutes les instances serveur.
--
-- Aucune donnée personnelle n'est stockée : l'email et l'IP
-- n'arrivent que sous forme d'empreintes SHA-256 poivrées,
-- calculées côté application. Le compteur fait son travail sans
-- jamais savoir qui il compte.
-- ============================================================

create table public.tentatives (
  id             bigserial primary key,
  action         text not null,          -- 'connexion', 'mot_de_passe_oublie', 'borne'…
  empreinte_cle  text not null,          -- SHA-256 poivré de l'email, du code, de la borne
  empreinte_ip   text,                   -- SHA-256 poivré de l'IP appelante
  created_at     timestamptz not null default now()
);

create index idx_tentatives_cle on public.tentatives (action, empreinte_cle, created_at desc);
create index idx_tentatives_ip  on public.tentatives (action, empreinte_ip, created_at desc);

comment on table public.tentatives is
  'Compteur de tentatives pour la limitation de débit. Contenu pseudonymisé (empreintes) et purgé automatiquement au-delà de 24 h.';

-- RLS sans aucune politique : la table n'est accessible qu'au
-- service role, qui n'y est pas soumis. Un client authentifié ne
-- peut ni lire ses compteurs, ni les effacer pour se débloquer.
alter table public.tentatives enable row level security;

revoke all on public.tentatives from anon, authenticated;
grant select, insert, delete on public.tentatives to service_role;
grant usage, select on sequence public.tentatives_id_seq to service_role;

-- ------------------------------------------------------------
-- Vérifie et consomme un jeton de tentative.
--
-- Deux seuils indépendants : par clé (l'email visé — contre le
-- bourrage d'un compte précis) et par IP (contre le balayage de
-- nombreux comptes depuis une même source).
--
-- Une tentative refusée n'est PAS enregistrée : sinon un
-- attaquant persistant prolongerait indéfiniment le blocage du
-- titulaire légitime en continuant de frapper.
-- ------------------------------------------------------------
create or replace function public.verifier_limite(
  p_action        text,
  p_empreinte_cle text,
  p_empreinte_ip  text,
  p_max_cle       int,
  p_max_ip        int,
  p_fenetre_secondes int
)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_fenetre  interval := make_interval(secs => p_fenetre_secondes);
  v_depuis   timestamptz := now() - v_fenetre;
  v_nb_cle   int;
  v_nb_ip    int;
  v_plus_ancienne timestamptz;
  v_motif    text;
begin
  -- Ménage opportuniste : le compteur n'a aucune raison de garder
  -- une trace au-delà de la journée.
  delete from public.tentatives where created_at < now() - interval '24 hours';

  select count(*) into v_nb_cle
    from public.tentatives
   where action = p_action
     and empreinte_cle = p_empreinte_cle
     and created_at > v_depuis;

  select count(*) into v_nb_ip
    from public.tentatives
   where action = p_action
     and p_empreinte_ip is not null
     and empreinte_ip = p_empreinte_ip
     and created_at > v_depuis;

  if v_nb_cle >= p_max_cle then
    v_motif := 'cle';
  elsif p_empreinte_ip is not null and v_nb_ip >= p_max_ip then
    v_motif := 'ip';
  end if;

  if v_motif is not null then
    -- Délai avant que la fenêtre glissante ne libère une place
    select min(created_at) into v_plus_ancienne
      from public.tentatives
     where action = p_action
       and created_at > v_depuis
       and ((v_motif = 'cle' and empreinte_cle = p_empreinte_cle)
         or (v_motif = 'ip'  and empreinte_ip  = p_empreinte_ip));

    return jsonb_build_object(
      'autorise', false,
      'motif', v_motif,
      'reessayer_dans', greatest(
        1,
        ceil(extract(epoch from (v_plus_ancienne + v_fenetre - now())))::int)
    );
  end if;

  insert into public.tentatives (action, empreinte_cle, empreinte_ip)
  values (p_action, p_empreinte_cle, p_empreinte_ip);

  return jsonb_build_object(
    'autorise', true,
    'restant_cle', p_max_cle - v_nb_cle - 1
  );
end;
$$;

revoke execute on function public.verifier_limite(text, text, text, int, int, int)
  from public, anon, authenticated;
grant  execute on function public.verifier_limite(text, text, text, int, int, int)
  to service_role;

-- ------------------------------------------------------------
-- Remise à zéro après un succès : une connexion réussie efface
-- l'ardoise de l'email concerné, pour qu'une suite de fautes de
-- frappe ne pénalise pas la session suivante.
-- ------------------------------------------------------------
create or replace function public.reinitialiser_limite(
  p_action        text,
  p_empreinte_cle text
)
returns void
language sql
volatile
security definer set search_path = public
as $$
  delete from public.tentatives
   where action = p_action and empreinte_cle = p_empreinte_cle;
$$;

revoke execute on function public.reinitialiser_limite(text, text)
  from public, anon, authenticated;
grant  execute on function public.reinitialiser_limite(text, text) to service_role;
