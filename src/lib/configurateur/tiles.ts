// Génération des instances de carreaux pour le rendu 3D « zellige ».
//
// Chaque carreau est une vraie boîte biseautée (RoundedBox) posée en relief sur
// un noyau de joint : les écarts entre carreaux laissent voir le noyau en
// contrebas → joints creux et ombrés. Un jitter déterministe (seed) donne le
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

export interface TileBuildParams {
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  tailleCm: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
}

export interface TileBuildResult {
  count: number;
  matrices: Float32Array; // count × 16
  colors: Float32Array; // count × 3 (espace linéaire)
  footprint: number; // côté du carreau (unités) — pour la géométrie partagée
  thickness: number; // épaisseur du carreau (unités)
  radius: number; // rayon de biseau (unités)
  core: { x: number; y: number; z: number }; // dimensions du noyau de joint
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

  const pitch = tailleCm * CM_TO_UNIT; // pas (centre à centre)
  const gap = pitch * 0.1; // joint ≈ 10 %
  const footprint = pitch - gap;
  const thickness = Math.max(pitch * 0.3, 0.004);
  const radius = Math.min(footprint, thickness) * 0.16;

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

  // Répartition équilibrée des couleurs sur l'ensemble des carreaux.
  const palette = distributeCouleurs(total, couleurs, seed);

  const matrices = new Float32Array(total * 16);
  const colors = new Float32Array(total * 3);

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

  let idx = 0;
  for (const f of faces) {
    // base orthonormée (u, v, n) directe → quaternion d'orientation de la face
    v.copy(f.normal).cross(f.u).normalize();
    basis.makeBasis(f.u, v, f.normal);
    qBase.setFromRotationMatrix(basis);

    const halfU = (f.countU * pitch) / 2;
    const halfV = (f.countV * pitch) / 2;

    for (let i = 0; i < f.countU; i++) {
      for (let j = 0; j < f.countV; j++) {
        const rng = mulberry32((seed ^ (idx * 0x9e3779b1)) >>> 0);

        const uPos = (i + 0.5) * pitch - halfU;
        const vPos = (j + 0.5) * pitch - halfV;
        const tilt = (rng() - 0.5) * 2 * 0.035; // ±2°
        const nPos = f.coreHalf + thickness / 2 + (rng() - 0.5) * 2 * 0.03 * pitch;
        const sc = 1 + (rng() - 0.5) * 2 * 0.04;

        qJit.setFromAxisAngle(f.normal, tilt);
        q.copy(qJit).multiply(qBase);

        pos.copy(f.u).multiplyScalar(uPos).addScaledVector(v, vPos).addScaledVector(f.normal, nPos);
        scl.set(sc, sc, 1);

        m.compose(pos, q, scl);
        m.toArray(matrices, idx * 16);

        // Couleur + légère irrégularité de glaçure (HSL).
        col.set(palette[idx]);
        col.getHSL(hsl);
        col.setHSL(hsl.h, clamp01(hsl.s + (rng() - 0.5) * 0.05), clamp01(hsl.l + (rng() - 0.5) * 0.06));
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
    contactY: -Hy / 2,
  };
}
