import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, clientDe, monterContexte, creerCle, type Contexte } from "./aides";

/**
 * Cycle de vie d'un trousseau : dépôt au comptoir, code de retrait,
 * remise au bénéficiaire. C'est le cœur métier de Keywi — s'il
 * casse, le service ne rend plus aucun service.
 */
describe("Dépôt et retrait au comptoir", () => {
  let ctx: Contexte;

  beforeAll(async () => {
    ctx = await monterContexte(3);
  });
  afterAll(async () => {
    await ctx.nettoyer();
  });

  it("attribue une case au scan du badge, puis enregistre le dépôt", async () => {
    const cle = await creerCle(ctx, "Studio dépôt");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    const { data: prepare } = await commercant.rpc("preparer_depot", {
      p_badge_uid: cle.badge,
    });
    const p = prepare as unknown as Record<string, unknown>;

    expect(p.ok).toBe(true);
    expect(p.case_numero).toBeTypeOf("number");
    expect(p.type_operation).toBe("depot");

    const { data: confirme } = await commercant.rpc("confirmer_depot", {
      p_key_id: cle.id,
    });
    const c = confirme as unknown as Record<string, unknown>;

    expect(c.ok).toBe(true);
    expect(c.case_numero).toBe(p.case_numero);

    // La clé est déposée et sa case occupée
    const { data: apres } = await admin
      .from("keys")
      .select("statut, slot_id, slots(statut)")
      .eq("id", cle.id)
      .single();
    expect(apres!.statut).toBe("deposee");
    expect(apres!.slots!.statut).toBe("occupee");
  });

  it("refuse un badge rattaché à un autre point relais", async () => {
    const autre = await monterContexte(1);
    const cle = await creerCle(autre, "Clé ailleurs");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    const { data } = await commercant.rpc("preparer_depot", {
      p_badge_uid: cle.badge,
    });
    const r = data as unknown as Record<string, unknown>;

    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("MAUVAIS_POINT_RELAIS");

    await autre.nettoyer();
  });

  it("refuse le dépôt d'une clé non payée", async () => {
    const cle = await creerCle(ctx, "Clé impayée");
    await admin
      .from("keys")
      .update({ paiement_statut: "en_attente" })
      .eq("id", cle.id);

    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);
    const { data } = await commercant.rpc("preparer_depot", {
      p_badge_uid: cle.badge,
    });
    const r = data as unknown as Record<string, unknown>;

    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("PAIEMENT_MANQUANT");
  });

  it("libère la case au retrait et invalide le code utilisé", async () => {
    const cle = await creerCle(ctx, "Studio retrait");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    await commercant.rpc("preparer_depot", { p_badge_uid: cle.badge });
    await commercant.rpc("confirmer_depot", { p_key_id: cle.id });

    const { data: codeCree } = await admin.rpc("api_creer_code_retrait", {
      p_key_id: cle.id,
      p_hote_id: ctx.hoteId,
      p_beneficiaire_nom: "Bénéficiaire test",
    });
    const code = (codeCree as unknown as { code_6: string }).code_6;

    const { data: retrait } = await commercant.rpc("confirmer_retrait", {
      p_code: code,
      p_badge_uid: cle.badge,
    });
    const r = retrait as unknown as Record<string, unknown>;
    expect(r.ok).toBe(true);

    const { data: apres } = await admin
      .from("keys")
      .select("statut, slot_id")
      .eq("id", cle.id)
      .single();
    expect(apres!.statut).toBe("retiree");
    expect(apres!.slot_id).toBeNull();

    const { data: ac } = await admin
      .from("access_codes")
      .select("statut")
      .eq("code_6", code)
      .single();
    expect(ac!.statut).toBe("utilise");
  });

  it("bloque le retrait si le badge re-scanné n'est pas le bon", async () => {
    const cleA = await creerCle(ctx, "Trousseau A");
    const cleB = await creerCle(ctx, "Trousseau B");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    await commercant.rpc("preparer_depot", { p_badge_uid: cleA.badge });
    await commercant.rpc("confirmer_depot", { p_key_id: cleA.id });

    const { data: codeCree } = await admin.rpc("api_creer_code_retrait", {
      p_key_id: cleA.id,
      p_hote_id: ctx.hoteId,
    });
    const code = (codeCree as unknown as { code_6: string }).code_6;

    // Le commerçant présente le mauvais trousseau : c'est la
    // vérification croisée qui doit l'arrêter
    const { data } = await commercant.rpc("confirmer_retrait", {
      p_code: code,
      p_badge_uid: cleB.badge,
    });
    const r = data as unknown as Record<string, unknown>;

    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("BADGE_DIFFERENT");

    // …et la clé A reste en dépôt, sa case toujours occupée.
    // (« prete_retrait » : un code actif existe désormais)
    const { data: apres } = await admin
      .from("keys")
      .select("statut, slot_id")
      .eq("id", cleA.id)
      .single();
    expect(apres!.statut).toBe("prete_retrait");
    expect(apres!.slot_id).not.toBeNull();
  });
});

/**
 * L'attribution de case utilise FOR UPDATE SKIP LOCKED : deux
 * dépôts simultanés ne doivent jamais recevoir la même case.
 */
describe("Attribution atomique des cases", () => {
  it("donne des cases distinctes à deux dépôts concurrents", async () => {
    const ctx = await monterContexte(5);
    const [a, b] = await Promise.all([
      creerCle(ctx, "Concurrent A"),
      creerCle(ctx, "Concurrent B"),
    ]);
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    const [ra, rb] = await Promise.all([
      commercant.rpc("preparer_depot", { p_badge_uid: a.badge }),
      commercant.rpc("preparer_depot", { p_badge_uid: b.badge }),
    ]);

    const ca = (ra.data as unknown as Record<string, unknown>).case_numero;
    const cb = (rb.data as unknown as Record<string, unknown>).case_numero;

    expect(ca).toBeTypeOf("number");
    expect(cb).toBeTypeOf("number");
    expect(ca).not.toBe(cb);

    await ctx.nettoyer();
  });

  it("refuse le dépôt quand toutes les cases sont prises", async () => {
    const ctx = await monterContexte(1);
    const a = await creerCle(ctx, "Occupe la case");
    const b = await creerCle(ctx, "Arrive trop tard");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);

    await commercant.rpc("preparer_depot", { p_badge_uid: a.badge });
    const { data } = await commercant.rpc("preparer_depot", {
      p_badge_uid: b.badge,
    });
    const r = data as unknown as Record<string, unknown>;

    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("AUCUNE_CASE_LIBRE");

    await ctx.nettoyer();
  });
});
