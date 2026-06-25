"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { genererTexturesFaces, distributeCouleurs, drawFaceTexture } from "@/lib/configurateur/texture";

interface CubeKubeProps {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
  autoRotate: boolean;
}

export function CubeKube({
  tailleCm,
  nbLongueur,
  nbLargeur,
  nbHauteur,
  couleurs,
  couleurJoint,
  seed,
  dessousCarrelee,
  autoRotate,
}: CubeKubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotY = useRef(Math.PI / 4);
  const rotX = useRef(-0.15);
  const isUserInteracting = useRef(false);
  const lastInteraction = useRef(0);

  // Build materials from canvas textures
  const materials = useMemo(() => {
    if (typeof window === "undefined") return [];

    const totalTiles =
      nbLongueur * nbLargeur * (dessousCarrelee ? 2 : 1) +
      (nbLongueur + nbLargeur) * 2 * nbHauteur;
    const res = totalTiles > 2000 ? 16 : totalTiles > 500 ? 24 : 32;

    function makeMat(tilesX: number, tilesY: number, seedOffset: number): THREE.MeshStandardMaterial {
      const canvas = document.createElement("canvas");
      const total = tilesX * tilesY;
      const colors = distributeCouleurs(total, couleurs, seed + seedOffset);
      drawFaceTexture(canvas, { tilesX, tilesY, tileColors: colors, groutColor: couleurJoint, resolution: res });
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.3,
        metalness: 0.05,
        envMapIntensity: 0.6,
      });
    }

    function makeBlankMat(): THREE.MeshStandardMaterial {
      return new THREE.MeshStandardMaterial({ color: "#e8e8e8", roughness: 0.8 });
    }

    // BoxGeometry material order: +x, -x, +y, -y, +z, -z
    return [
      makeMat(nbHauteur, nbLargeur, 0),    // right (+x): depth × width
      makeMat(nbHauteur, nbLargeur, 100),   // left (-x)
      makeMat(nbLongueur, nbLargeur, 200),  // top (+y)
      dessousCarrelee ? makeMat(nbLongueur, nbLargeur, 300) : makeBlankMat(), // bottom (-y)
      makeMat(nbLongueur, nbHauteur, 400),  // front (+z): length × height
      makeMat(nbLongueur, nbHauteur, 500),  // back (-z)
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailleCm, nbLongueur, nbLargeur, nbHauteur, couleurs.join(","), couleurJoint, seed, dessousCarrelee]);

  // Cleanup textures on remount
  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  // Scale the cube to proportional visual size (max 2.4 units)
  const longueurCm = nbLongueur * tailleCm;
  const largeurCm = nbLargeur * tailleCm;
  const hauteurCm = nbHauteur * tailleCm;
  const maxDim = Math.max(longueurCm, largeurCm, hauteurCm);
  const scale = 2.4 / maxDim;
  const W = longueurCm * scale; // X
  const H = hauteurCm * scale;  // Y
  const D = largeurCm * scale;  // Z

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const now = Date.now();
    if (autoRotate && !isUserInteracting.current && now - lastInteraction.current > 1500) {
      rotY.current += delta * 0.35;
    }
    meshRef.current.rotation.y = rotY.current;
    meshRef.current.rotation.x = rotX.current;
  });

  return (
    <mesh ref={meshRef} material={materials} castShadow receiveShadow>
      <boxGeometry args={[W, H, D]} />
    </mesh>
  );
}
