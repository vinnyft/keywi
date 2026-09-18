-- ============================================================
-- 0026 — Attribution commerciale
-- Chaque commercial reçoit un code unique (ex. KW-MARIE) qu'il
-- communique au commerçant lors du démarchage. Le prospect le saisit
-- sur le formulaire « Devenir point relais » ; à la validation, le
-- point relais est relié au commercial signataire (pour la
-- rémunération, les rapports et les alertes de capacité).
-- ============================================================

-- Code de parrainage porté par le profil commercial
alter table public.profiles
  add column if not exists code_commercial text unique;

-- Génère un code lisible « KW-<PRÉNOM> » unique (repli aléatoire).
create or replace function public.generer_code_commercial(p_nom text)
returns text
language plpgsql
as $$
declare
  base     text;
  candidat text;
  suffixe  int := 1;
begin
  -- Premier mot du nom, sans accents ni caractères spéciaux, en MAJ
  base := upper(regexp_replace(
            translate(coalesce(split_part(p_nom, ' ', 1), ''),
                      'àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ',
                      'aaaeeeeiioouuucAAAEEEEIIOOUUUC'),
            '[^A-Za-z0-9]', '', 'g'));
  if base is null or base = '' then
    base := substr(md5(gen_random_uuid()::text), 1, 5);
  end if;

  candidat := 'KW-' || base;
  while exists (select 1 from public.profiles where code_commercial = candidat) loop
    suffixe  := suffixe + 1;
    candidat := 'KW-' || base || suffixe::text;
  end loop;
  return candidat;
end;
$$;

-- Attribue automatiquement un code à tout profil commercial qui n'en a pas
create or replace function public.assigner_code_commercial()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'commercial' and new.code_commercial is null then
    new.code_commercial := public.generer_code_commercial(new.nom);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_code_commercial on public.profiles;
create trigger trg_code_commercial
  before insert or update of role on public.profiles
  for each row execute function public.assigner_code_commercial();

-- Backfill des commerciaux déjà en base — en boucle (et non en une
-- seule requête) pour que chaque ligne « voie » les codes déjà
-- attribués aux précédentes : deux commerciaux homonymes obtiennent
-- ainsi KW-MARIE puis KW-MARIE2 au lieu d'entrer en collision.
do $$
declare
  r record;
begin
  for r in
    select id, nom from public.profiles
    where role = 'commercial' and code_commercial is null
  loop
    update public.profiles
    set code_commercial = public.generer_code_commercial(r.nom)
    where id = r.id;
  end loop;
end $$;

-- Code saisi par le prospect sur sa candidature (brut, résolu à la validation)
alter table public.candidatures_commercants
  add column if not exists commercial_code text;

-- Point relais → commercial signataire (renseigné à la validation)
alter table public.relay_points
  add column if not exists commercial_id uuid
    references public.profiles (id) on delete set null;

create index if not exists idx_relay_points_commercial
  on public.relay_points (commercial_id);
