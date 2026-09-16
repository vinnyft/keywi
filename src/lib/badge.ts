/**
 * Normalisation d'un identifiant de badge (UID de puce NFC/RFID ou
 * code imprimé), pour que le même badge physique donne toujours la
 * même chaîne quel que soit le lecteur.
 *
 * Un badge lu par Web NFC arrive en hexa avec séparateurs
 * (« 04:A2:B3 »), un lecteur USB peut le sortir sans séparateur
 * (« 04A2B3 ») ou en casse différente. On canonise en :
 *   - passant en MAJUSCULES,
 *   - retirant tout ce qui n'est pas alphanumérique (`:`, `-`, espaces…).
 *
 * ⚠️ Ne réconcilie PAS un encodage différent : un UID sorti en
 * décimal ne correspondra jamais au même UID lu en hexadécimal.
 * Les lecteurs USB doivent être réglés en sortie hexa.
 *
 * Le code imprimé (« KWIA7K3M ») ne contient déjà que des
 * alphanumériques : la normalisation est sans effet dessus.
 */
export function normaliserBadge(brut: string): string {
  return brut.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
