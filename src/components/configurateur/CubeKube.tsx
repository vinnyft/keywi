"use client";

import { useMemo, useRef, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { buildTileInstances, CM_TO_UNIT } from "@/lib/configurateur/tiles";
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
}

// Au-delà de ce nombre de carreaux, le rendu en relief (une boîte par carreau)
// devient trop lourd pour tenir 60 fps → bascule sur une texture cuite par face
// (grille + couleurs + joint), tout en gardant les reflets de glaçure.
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
    ]
  );

  // Géométrie d'un carreau : boîte biseautée (arêtes qui accrochent la lumière).
  const tileGeo = useMemo(
    () => new RoundedBoxGeometry(build.footprint, build.footprint, build.thickness, 2, build.radius),
    [build]
  );

  // Matériau PBR « glaçure émaillée » : reflets via clearcoat + Environment.
  const tileMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // la couleur réelle vient de instanceColor
        metalness: 0,
        roughness: 0.32,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 0.9,
      }),
    []
  );

  const groutGeo = useMemo(
    () => new THREE.BoxGeometry(build.core.x, build.core.y, build.core.z),
    [build]
  );
  const groutMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: props.couleurJoint, roughness: 0.95, metalness: 0 }),
    [props.couleurJoint]
  );

  // Application des matrices + couleurs d'instances (sans reconstruire la scène).
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

  // Libération mémoire au remplacement.
  useEffect(() => () => tileGeo.dispose(), [tileGeo]);
  useEffect(() => () => groutGeo.dispose(), [groutGeo]);
  useEffect(() => () => tileMat.dispose(), [tileMat]);
  useEffect(() => () => groutMat.dispose(), [groutMat]);

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
  const { tailleCm, nbLongueur, nbLargeur, nbHauteur, couleurs, couleurJoint, seed, dessousCarrelee } = props;
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
    });
    return canvases.map((canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return new THREE.MeshPhysicalMaterial({
        map: tex,
        roughness: 0.32,
        metalness: 0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
        envMapIntensity: 0.85,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailleCm, nbLongueur, nbLargeur, nbHauteur, couleursKey, couleurJoint, seed, dessousCarrelee]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
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
