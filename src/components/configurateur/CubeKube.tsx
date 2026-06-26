"use client";

import { useMemo, useRef, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { buildTileInstances, CM_TO_UNIT, type MotifMosaique } from "@/lib/configurateur/tiles";
import { genererTexturesFaces } from "@/lib/configurateur/texture";

export interface CubeKubeProps {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
  motif?: MotifMosaique;
}

// Au-delà de ce nombre de carreaux le rendu en relief devient trop lourd → fallback texture.
const SEUIL_INSTANCES = 36000;

export function CubeKube(props: CubeKubeProps) {
  const { nbLongueur, nbLargeur, nbHauteur, dessousCarrelee } = props;
  const totalTiles =
    nbLongueur * nbLargeur * (dessousCarrelee ? 2 : 1) +
    (nbLongueur + nbLargeur) * 2 * nbHauteur;

  return totalTiles <= SEUIL_INSTANCES ? (
    <CubeRelief {...props} />
  ) : (
    <CubeTexture {...props} />
  );
}

// ─── Ondulations basse fréquence « orange-peel » pour le clearcoatNormalMap.
// Brise les reflets en « flaques » irrégulières typiques de la glaçure artisanale.
function createClearcoatNormalMap(): THREE.Texture {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const d = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const fx = x / S, fy = y / S;
      const eps = 2 / S;
      const h = (px: number, py: number) =>
        Math.sin(px * 4.7 + py * 3.1) * 0.50
        + Math.sin(px * 7.3 + py * 9.2) * 0.35
        + Math.sin(px * 11.1 + py * 6.8) * 0.15;
      const dx = (h(fx + eps, fy) - h(fx - eps, fy)) / (2 * eps);
      const dy = (h(fx, fy + eps) - h(fx, fy - eps)) / (2 * eps);
      d[i]   = Math.min(255, Math.max(0, 128 + Math.round(dx * 26)));
      d[i+1] = Math.min(255, Math.max(0, 128 + Math.round(dy * 26)));
      d[i+2] = 255;
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── Aspérités haute fréquence du biscuit céramique → normalMap sur le corps.
function createBodyNormalMap(): THREE.Texture {
  const S = 64;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const d = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const fx = x / S, fy = y / S;
      const eps = 1.5 / S;
      const h = (px: number, py: number) => {
        const n = Math.sin(px * 439.3 + py * 737.1) * 31891.7
                + Math.sin(px * 201.5 + py * 371.9) * 18543.3;
        return n - Math.floor(n);
      };
      const dx = (h(fx + eps, fy) - h(fx - eps, fy)) * 50;
      const dy = (h(fx, fy + eps) - h(fx, fy - eps)) * 50;
      d[i]   = Math.min(255, Math.max(0, 128 + Math.round(dx)));
      d[i+1] = Math.min(255, Math.max(0, 128 + Math.round(dy)));
      d[i+2] = 255;
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── Gradient radial de brillance : glaçure plus épaisse (poolée) au centre,
// mince aux bords → roughnessMap (canal vert, multiplié par roughness).
function createRoughnessMap(): THREE.Texture {
  const S = 32;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.6);
  g.addColorStop(0,    "#444444");
  g.addColorStop(0.55, "#888888");
  g.addColorStop(1,    "#cccccc");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── clearcoatRoughness selon la clarté (L) de la palette choisie.
// Clair/pastel → reflets laiteux diffus (0.10–0.18).
// Sombre/saturé → glaçure vitreuse, flaques nettes (0.04–0.10).
function clearcoatRoughnessFromColors(couleurs: string[]): number {
  if (!couleurs.length) return 0.10;
  const col = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  const avgL = couleurs.reduce((sum, hex) => {
    col.set(hex); col.getHSL(hsl); return sum + hsl.l;
  }, 0) / couleurs.length;
  return THREE.MathUtils.lerp(0.04, 0.18, avgL);
}

// ─── Intensité du clearcoatNormalMap selon la saturation.
// Bleus/verts/rouges → ondulations marquées. Neutres clairs → réduites.
function clearcoatNormalScaleFromColors(couleurs: string[]): number {
  if (!couleurs.length) return 0.35;
  const col = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  const avgS = couleurs.reduce((sum, hex) => {
    col.set(hex); col.getHSL(hsl); return sum + hsl.s;
  }, 0) / couleurs.length;
  return THREE.MathUtils.lerp(0.15, 0.55, avgS);
}

// ─────────────────────────── Rendu en relief (zellige) ───────────────────────────

function CubeRelief(props: CubeKubeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const couleursKey = props.couleurs.join(",");

  const build = useMemo(
    () => buildTileInstances(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.tailleCm,
      props.nbLongueur,
      props.nbLargeur,
      props.nbHauteur,
      couleursKey,
      props.couleurJoint,
      props.seed,
      props.dessousCarrelee,
      props.motif,
    ]
  );

  const tileGeo = useMemo(
    () => new RoundedBoxGeometry(build.footprint, build.footprint, build.thickness, 2, build.radius),
    [build]
  );

  // Textures procédurales partagées — créées une seule fois côté client.
  const clearcoatNormalMap = useMemo(
    () => (typeof window !== "undefined" ? createClearcoatNormalMap() : null),
    []
  );
  const bodyNormalMap = useMemo(
    () => (typeof window !== "undefined" ? createBodyNormalMap() : null),
    []
  );
  const roughnessMap = useMemo(
    () => (typeof window !== "undefined" ? createRoughnessMap() : null),
    []
  );

  // Matériau PBR glaçure — clearcoatRoughness et clearcoatNormalScale sont
  // mis à jour dynamiquement (sans recréer le matériau) selon les couleurs.
  const tileMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.10,
        clearcoatNormalMap: clearcoatNormalMap ?? undefined,
        clearcoatNormalScale: new THREE.Vector2(0.35, 0.35),
        normalMap: bodyNormalMap ?? undefined,
        normalScale: new THREE.Vector2(0.10, 0.10),
        roughnessMap: roughnessMap ?? undefined,
        envMapIntensity: 1.2,
      }),
    [clearcoatNormalMap, bodyNormalMap, roughnessMap]
  );

  // Adapte la brillance/ondulations à chaque changement de couleur.
  useLayoutEffect(() => {
    tileMat.clearcoatRoughness = clearcoatRoughnessFromColors(props.couleurs);
    const s = clearcoatNormalScaleFromColors(props.couleurs);
    tileMat.clearcoatNormalScale.set(s, s);
    tileMat.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couleursKey, tileMat]);

  const groutGeo = useMemo(
    () => new THREE.BoxGeometry(build.core.x, build.core.y, build.core.z),
    [build]
  );
  // Joint blanc cassé mat — pas de clearcoat (spec).
  const groutMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: props.couleurJoint, roughness: 0.90, metalness: 0 }),
    [props.couleurJoint]
  );

  // Application des matrices + couleurs sans remount.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < build.count; i++) {
      m.fromArray(build.matrices, i * 16);
      mesh.setMatrixAt(i, m);
      c.fromArray(build.colors, i * 3);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [build]);

  useEffect(() => () => tileGeo.dispose(), [tileGeo]);
  useEffect(() => () => groutGeo.dispose(), [groutGeo]);
  useEffect(() => () => tileMat.dispose(), [tileMat]);
  useEffect(() => () => groutMat.dispose(), [groutMat]);
  useEffect(() => () => clearcoatNormalMap?.dispose(), [clearcoatNormalMap]);
  useEffect(() => () => bodyNormalMap?.dispose(), [bodyNormalMap]);
  useEffect(() => () => roughnessMap?.dispose(), [roughnessMap]);

  return (
    <group>
      <mesh geometry={groutGeo} material={groutMat} castShadow receiveShadow />
      <instancedMesh
        ref={meshRef}
        args={[tileGeo, tileMat, build.count]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

// ─────────────────────────── Fallback texture (très grand nombre de carreaux) ───────────────────────────

function CubeTexture(props: CubeKubeProps) {
  const { tailleCm, nbLongueur, nbLargeur, nbHauteur, couleurs, couleurJoint, seed, dessousCarrelee, motif } = props;
  const couleursKey = couleurs.join(",");

  const materials = useMemo(() => {
    if (typeof window === "undefined") return [];
    const { canvases } = genererTexturesFaces({
      couleurs,
      couleurJoint,
      nbLongueur,
      nbLargeur,
      nbHauteur,
      seed,
      dessousCarrelee,
      motif,
    });
    return canvases.map((canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return new THREE.MeshPhysicalMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.1,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailleCm, nbLongueur, nbLargeur, nbHauteur, couleursKey, couleurJoint, seed, dessousCarrelee, motif]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => { m.map?.dispose(); m.dispose(); });
    };
  }, [materials]);

  const W = nbLongueur * tailleCm * CM_TO_UNIT;
  const H = nbHauteur * tailleCm * CM_TO_UNIT;
  const D = nbLargeur * tailleCm * CM_TO_UNIT;

  return (
    <mesh material={materials} castShadow receiveShadow>
      <boxGeometry args={[W, H, D]} />
    </mesh>
  );
}
