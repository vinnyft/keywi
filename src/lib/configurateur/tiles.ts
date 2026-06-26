// Génération des instances de carreaux pour le rendu 3D « zellige ».
//
// Chaque carreau est une vraie boîte biseautée (RoundedBox) posée en relief.
// Les joints sont remplis par des dalles de ciment qui montent presque jusqu'au
// sommet des carreaux : ceux-ci ne dépassent que d'un léger retrait → joints
// pleins et mats, pas de canaux creux. Un jitter déterministe (seed) donne le
// côté fait-main : micro-rotation, micro-décalage de hauteur, variation
// d'échelle et de teinte par carreau.
//
// Tout est reproductible à partir du seed → le rendu correspond exactement à ce
// qui sera produit. On renvoie des buffers (matrices + couleurs) appliqués à un
// THREE.InstancedMesh côté composant.

import * as THREE from "three";
import { distributeCouleurs } from "./texture";

// Échelle scène : 1 cm = 0,02 unité (150 cm = 3 unités).
export const CM_TO_UNIT = 0.02;

// PRNG déterministe par carreau (mulberry32).
function mulberry32(seed: number) {
  return function () {
    let s = (seed += 0x6d2b79f5);
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Motif de répartition des couleurs sur les carreaux.
export type MotifMosaique = "aleatoire" | "lignes" | "croise" | "uni" | "accent";

// Couleur de base d'un carreau selon le motif et sa position (i, j) dans la grille.
// Le jitter HSL « fait main » est appliqué ensuite, par-dessus, dans tous les cas.
function couleurMotif(
  motif: MotifMosaique,
  i: number,
  j: number,
  couleurs: string[],
  accentR: number,
): string {
  const nb = couleurs.length;
  if (nb === 1) return couleurs[0];
  switch (motif) {
    case "uni":
      return couleurs[0];
    case "lignes":
      // Bandes : la couleur dépend de la rangée verticale (j).
      return couleurs[j % nb];
    case "croise":
      // Diagonales : effet chevron / tartan.
      return couleurs[(i + j) % nb];
    case "accent": {
      // Fond uni (couleur 0) + ~16 % de carreaux d'accent (couleurs 1…n).
      if (accentR < 0.16) {
        const k = 1 + Math.floor((accentR / 0.16) * (nb - 1));
        return couleurs[Math.min(k, nb - 1)];
      }
      return couleurs[0];
    }
    default:
      return couleurs[0];
  }
}

export interface TileBuildParams {
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  tailleCm: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
  motif?: MotifMosaique;
}

// Une dalle de ciment qui remplit les creux entre carreaux d'une face. Elle
// monte presque jusqu'au sommet des carreaux (joint légèrement en retrait) au
// lieu de laisser un canal vide et profond.
export interface GroutSlab {
  center: [number, number, number];
  size: [number, number, number];
}

export interface TileBuildResult {
  count: number;
  matrices: Float32Array; // count × 16
  colors: Float32Array; // count × 3 (espace linéaire)
  footprint: number; // côté du carreau (unités) — pour la géométrie partagée
  thickness: number; // épaisseur du carreau (unités)
  radius: number; // rayon de biseau (unités)
  core: { x: number; y: number; z: number }; // dimensions du noyau de joint (backing)
  groutSlabs: GroutSlab[]; // dalles de ciment qui remplissent les joints, par face
  contactY: number; // y du bas du meuble (placement de l'ombre de contact)
}

interface Face {
  normal: THREE.Vector3;
  u: THREE.Vector3;
  countU: number;
  countV: number;
  coreHalf: number; // demi-extension le long de la normale
}

export function buildTileInstances(p: TileBuildParams): TileBuildResult {
  const { nbLongueur, nbLargeur, nbHauteur, tailleCm, couleurs, seed, dessousCarrelee } = p;
  const motif: MotifMosaique = p.motif ?? "aleatoire";

  const pitch = tailleCm * CM_TO_UNIT; // pas (centre à centre)
  const gap = pitch * 0.1; // joint ≈ 10 %
  const footprint = pitch - gap;
  const thickness = Math.max(pitch * 0.3, 0.004);
  const radius = Math.min(footprint, thickness) * 0.16;

  // Le ciment monte jusqu'à `thickness - jointRecess` : un joint peu profond
  // qui remplit l'espace, les carreaux ne dépassent que de `jointRecess`.
  const jointRecess = thickness * 0.3;
  const slabThick = thickness * 1.3; // épais → recouvre le noyau, pas de vide

  const Lx = nbLongueur * pitch; // X
  const Hy = nbHauteur * pitch; // Y
  const Wz = nbLargeur * pitch; // Z

  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);

  const faces: Face[] = [
    // Dessus (+Y)
    { normal: new THREE.Vector3(0, 1, 0), u: X.clone(), countU: nbLongueur, countV: nbLargeur, coreHalf: Hy / 2 },
    // Faces longueur avant/arrière (±Z)
    { normal: new THREE.Vector3(0, 0, 1), u: X.clone(), countU: nbLongueur, countV: nbHauteur, coreHalf: Wz / 2 },
    { normal: new THREE.Vector3(0, 0, -1), u: X.clone(), countU: nbLongueur, countV: nbHauteur, coreHalf: Wz / 2 },
    // Faces largeur droite/gauche (±X)
    { normal: new THREE.Vector3(1, 0, 0), u: Z.clone(), countU: nbLargeur, countV: nbHauteur, coreHalf: Lx / 2 },
    { normal: new THREE.Vector3(-1, 0, 0), u: Z.clone(), countU: nbLargeur, countV: nbHauteur, coreHalf: Lx / 2 },
  ];
  if (dessousCarrelee) {
    faces.push({ normal: new THREE.Vector3(0, -1, 0), u: X.clone(), countU: nbLongueur, countV: nbLargeur, coreHalf: Hy / 2 });
  }

  const total = faces.reduce((s, f) => s + f.countU * f.countV, 0);

  // Mode aléatoire : répartition équilibrée puis mélangée (un seul flux global).
  // Les autres motifs sont calculés par position (i, j) dans la boucle.
  const palette = motif === "aleatoire" ? distributeCouleurs(total, couleurs, seed) : null;

  const matrices = new Float32Array(total * 16);
  const colors = new Float32Array(total * 3);
  const groutSlabs: GroutSlab[] = [];

  const m = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const qBase = new THREE.Quaternion();
  const qJit = new THREE.Quaternion();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const v = new THREE.Vector3();
  const col = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };

  // ─── Arêtes et coins : fillets de ciment couvrant les jonctions entre faces ───
  // edgeOut = saillie du ciment sur la surface du cube (= épaisseur − retrait)
  const edgeOut = thickness - jointRecess;
  const eHX = Lx / 2, eHY = Hy / 2, eHZ = Wz / 2;
  const mX = eHX + edgeOut / 2, mY = eHY + edgeOut / 2, mZ = eHZ + edgeOut / 2;

  // 4 arêtes verticales (± X, ± Z), longueur = Hy
  for (const sx of [-1, 1] as const) for (const sz of [-1, 1] as const)
    groutSlabs.push({ center: [sx * mX, 0, sz * mZ], size: [edgeOut, Hy, edgeOut] });
  // 4 arêtes profondes (± X, ± Y), longueur = Wz
  for (const sx of [-1, 1] as const) for (const sy of [-1, 1] as const)
    groutSlabs.push({ center: [sx * mX, sy * mY, 0], size: [edgeOut, edgeOut, Wz] });
  // 4 arêtes larges (± Y, ± Z), longueur = Lx
  for (const sy of [-1, 1] as const) for (const sz of [-1, 1] as const)
    groutSlabs.push({ center: [0, sy * mY, sz * mZ], size: [Lx, edgeOut, edgeOut] });
  // 8 coins
  for (const sx of [-1, 1] as const) for (const sy of [-1, 1] as const) for (const sz of [-1, 1] as const)
    groutSlabs.push({ center: [sx * mX, sy * mY, sz * mZ], size: [edgeOut, edgeOut, edgeOut] });

  let idx = 0;
  for (const f of faces) {
    // base orthonormée (u, v, n) directe → quaternion d'orientation de la face
    v.copy(f.normal).cross(f.u).normalize();
    basis.makeBasis(f.u, v, f.normal);
    qBase.setFromRotationMatrix(basis);

    const halfU = (f.countU * pitch) / 2;
    const halfV = (f.countV * pitch) / 2;

    // Dalle de ciment de la face : étendue = emprise des carreaux (− gap), elle
    // affleure sous le sommet des carreaux pour remplir les joints.
    {
      const uExt = f.countU * pitch - gap;
      const vExt = f.countV * pitch - gap;
      const surface = f.coreHalf + thickness - jointRecess;
      const centerN = surface - slabThick / 2;
      const n = f.normal;
      // Axes alignés sur le repère monde → tailles/positions composantes.
      const size: [number, number, number] = [
        Math.abs(f.u.x) * uExt + Math.abs(v.x) * vExt + Math.abs(n.x) * slabThick,
        Math.abs(f.u.y) * uExt + Math.abs(v.y) * vExt + Math.abs(n.y) * slabThick,
        Math.abs(f.u.z) * uExt + Math.abs(v.z) * vExt + Math.abs(n.z) * slabThick,
      ];
      groutSlabs.push({ center: [n.x * centerN, n.y * centerN, n.z * centerN], size });
    }

    for (let i = 0; i < f.countU; i++) {
      for (let j = 0; j < f.countV; j++) {
        const rng = mulberry32((seed ^ (idx * 0x9e3779b1)) >>> 0);

        const uPos = (i + 0.5) * pitch - halfU;
        const vPos = (j + 0.5) * pitch - halfV;
        const tilt = (rng() - 0.5) * 0.0524;   // ±1.5°
        const uJit = (rng() - 0.5) * 0.0016;   // ±0.4 mm
        const vJit = (rng() - 0.5) * 0.0016;   // ±0.4 mm
        const nPos = f.coreHalf + thickness / 2 + (rng() - 0.5) * 0.0012; // ±0.3 mm
        const sc = 1 + (rng() - 0.5) * 0.04;   // ±2 %

        qJit.setFromAxisAngle(f.normal, tilt);
        q.copy(qJit).multiply(qBase);

        pos.copy(f.u).multiplyScalar(uPos + uJit).addScaledVector(v, vPos + vJit).addScaledVector(f.normal, nPos);
        scl.set(sc, sc, 1);

        m.compose(pos, q, scl);
        m.toArray(matrices, idx * 16);

        // Couleur de base selon le motif, puis irrégularité de glaçure (HSL).
        // accentR : valeur déterministe indépendante du flux de jitter.
        const accentR = mulberry32((seed ^ (idx * 0x85ebca6b)) >>> 0)();
        const baseHex = palette ? palette[idx] : couleurMotif(motif, i, j, couleurs, accentR);
        col.set(baseHex);
        col.getHSL(hsl);
        col.setHSL(
          (hsl.h + (rng() - 0.5) * 0.0167 + 1) % 1, // H ±3°
          clamp01(hsl.s + (rng() - 0.5) * 0.12),      // S ±6 %
          clamp01(hsl.l + (rng() - 0.5) * 0.20),      // L ±10 %
        );
        colors[idx * 3] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;

        idx++;
      }
    }
  }

  return {
    count: total,
    matrices,
    colors,
    footprint,
    thickness,
    radius,
    // Noyau de joint légèrement plus petit pour que les carreaux débordent.
    core: { x: Lx - gap, y: Hy - gap, z: Wz - gap },
    groutSlabs,
    contactY: -Hy / 2,
  };
}
