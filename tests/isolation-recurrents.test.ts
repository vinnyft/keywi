import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, clientDe, monterContexte, creerCle, type Contexte } from "./aides";

/**
 * L'isolation entre comptes ne repose pas sur le code applicatif
 * mais sur la RLS Postgres. Ces tests le vérifient en interrogeant
 * la base avec le jeton d'un autre utilisateur.
 */
describe("Isolation entre comptes (RLS)", () => {
  let a: Contexte;
  let b: Contexte;

  beforeAll(async () => {
    a = await monterContexte(2);
    b = await monterContexte(2);
  });
  afterAll(async () => {
    await a.nettoyer();
    await b.nettoyer();
  });

  it("un hôte ne voit pas les clés d'un autre hôte", async () => {
    const cleA = await creerCle(a, "Privée A");
    const clientB = await clientDe(b.hoteEmail, b.motDePasse);

    const { data } = await clientB.from("keys").select("id").eq("id", cleA.id);
    expect(data).toEqual([]);
  });

  it("un hôte ne peut pas créer de code sur la clé d'un autre", async () => {
    const cleA = await creerCle(a, "Privée A2");

    const { data } = await admin.rpc("api_creer_code_retrait", {
      p_key_id: cleA.id,
      p_hote_id: b.hoteId, // l'hôte B tente sur une clé de A
    });
    const r = data as unknown as Record<string, unknown>;

    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("CLE_INTROUVABLE");
  });

  it("un commerçant ne voit que les clés de son point relais", async () => {
    const cleA = await creerCle(a, "Chez A");
    const commercantB = await clientDe(b.commercantEmail, b.motDePasse);

    const { data } = await commercantB.from("keys").select("id").eq("id", cleA.id);
    expect(data).toEqual([]);
  });

  it("le journal des mouvements est inaltérable", async () => {
    const cle = await creerCle(a, "Journal");
    const commercant = await clientDe(a.commercantEmail, a.motDePasse);
    await commercant.rpc("preparer_depot", { p_badge_uid: cle.badge });
    await commercant.rpc("confirmer_depot", { p_key_id: cle.id });

    const { data: mvt } = await admin
      .from("movements")
      .select("id")
      .eq("key_id", cle.id)
      .single();

    // Même le service role, qui contourne la RLS, est arrêté par
    // le trigger d'immuabilité
    const { error: erreurUpdate } = await admin
      .from("movements")
      .update({ type: "retrait" })
      .eq("id", mvt!.id);
    expect(erreurUpdate).not.toBeNull();

    const { error: erreurDelete } = await admin
      .from("movements")
      .delete()
      .eq("id", mvt!.id);
    expect(erreurDelete).not.toBeNull();
  });
});

/**
 * Les accès récurrents tournent en tâche planifiée : la même
 * intervention ne doit jamais donner deux codes, même si le cron
 * s'exécute plusieurs fois.
 */
describe("Accès récurrents", () => {
  let ctx: Contexte;

  beforeAll(async () => {
    ctx = await monterContexte(2);
  });
  afterAll(async () => {
    await ctx.nettoyer();
  });

  it("génère un code une seule fois par intervention", async () => {
    const cle = await creerCle(ctx, "Ménage hebdo");

    // Récurrence couvrant tous les jours : la prochaine occurrence
    // tombe forcément dans les 24 h
    const { error } = await admin.from("acces_recurrents").insert({
      key_id: cle.id,
      beneficiaire_nom: "Prestataire",
      beneficiaire_email: "presta@test.keywi",
      jours_semaine: [0, 1, 2, 3, 4, 5, 6],
      heure_debut: "23:59",
      duree_heures: 6,
    });
    expect(error).toBeNull();

    const { data: premier } = await admin.rpc("generer_codes_recurrents");
    const p = premier as unknown as { nb_codes: number };
    expect(p.nb_codes).toBeGreaterThanOrEqual(1);

    // Deuxième passage : rien de neuf
    const { data: second } = await admin.rpc("generer_codes_recurrents");
    const s = second as unknown as { nb_codes: number };
    expect(s.nb_codes).toBe(0);

    const { count } = await admin
      .from("access_codes")
      .select("id", { count: "exact", head: true })
      .eq("key_id", cle.id);
    expect(count).toBe(1);
  });

  it("ne génère rien pour une récurrence en pause", async () => {
    const cle = await creerCle(ctx, "Ménage suspendu");
    await admin.from("acces_recurrents").insert({
      key_id: cle.id,
      beneficiaire_email: "pause@test.keywi",
      jours_semaine: [0, 1, 2, 3, 4, 5, 6],
      heure_debut: "23:59",
      actif: false,
    });

    await admin.rpc("generer_codes_recurrents");

    const { count } = await admin
      .from("access_codes")
      .select("id", { count: "exact", head: true })
      .eq("key_id", cle.id);
    expect(count).toBe(0);
  });
});

/** Le certificat public ne doit exposer que ce qui prouve la garde */
describe("Certificat de traçabilité", () => {
  it("expose la chaîne de garde sans donnée personnelle", async () => {
    const ctx = await monterContexte(2);
    const cle = await creerCle(ctx, "Trousseau certifié");
    const commercant = await clientDe(ctx.commercantEmail, ctx.motDePasse);
    await commercant.rpc("preparer_depot", { p_badge_uid: cle.badge });
    await commercant.rpc("confirmer_depot", { p_key_id: cle.id });

    const { data: k } = await admin
      .from("keys")
      .select("certificat_token")
      .eq("id", cle.id)
      .single();

    const { data } = await admin.rpc("certificat_public", {
      p_token: k!.certificat_token,
    });
    const c = data as unknown as Record<string, unknown>;

    expect(c.ok).toBe(true);
    expect(c.logement).toBe("Trousseau certifié");
    expect(Array.isArray(c.mouvements)).toBe(true);
    expect((c.mouvements as unknown[]).length).toBe(1);

    // Aucune trace de l'hôte dans la charge utile
    const brut = JSON.stringify(c);
    expect(brut).not.toContain(ctx.hoteEmail);
    expect(brut).not.toContain(ctx.hoteId);

    await ctx.nettoyer();
  });

  it("refuse un jeton inconnu", async () => {
    const { data } = await admin.rpc("certificat_public", {
      p_token: "00000000-0000-4000-a000-000000000000",
    });
    const c = data as unknown as Record<string, unknown>;
    expect(c.ok).toBe(false);
    expect(c.erreur).toBe("CERTIFICAT_INCONNU");
  });
});
