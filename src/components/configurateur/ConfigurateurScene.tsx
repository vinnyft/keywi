"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, OrbitControls, Bounds, useBounds } from "@react-three/drei";
import * as THREE from "three";
import { CubeKube } from "./CubeKube";
import { CM_TO_UNIT, type MotifMosaique } from "@/lib/configurateur/tiles";

interface SceneContentProps {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
  motif?: MotifMosaique;
  /** Autoriser le zoom molette/pincement (désactivé pour le cube décoratif d'accueil) */
  enableZoom?: boolean;
}

// Respiration verticale douce du pavé flottant.
function FloatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
  });
  return <group ref={groupRef}>{children}</group>;
}

// Recadre la caméra quand les dimensions changent (un 5 cm comme un 150 cm).
function RefitOnChange({ deps }: { deps: unknown[] }) {
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh().clip().fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

export function ConfigurateurScene({ enableZoom = true, ...props }: SceneContentProps) {
  // Bas du pavé → placement de l'ombre de contact (le cube est centré à l'origine).
  const contactY = -(props.nbHauteur * props.tailleCm * CM_TO_UNIT) / 2;
  const fitDeps = [props.tailleCm, props.nbLongueur, props.nbLargeur, props.nbHauteur, props.dessousCarrelee];

  return (
    <div className="w-full h-full" style={{ touchAction: "none" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.2, 2.4, 4.2], fov: 35 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.45} />
        {/* Lumière principale rasante : angle bas pour révéler le relief des carreaux. */}
        <directionalLight
          position={[4, 2.8, 5]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.55} />

        <Suspense fallback={null}>
          <Bounds fit clip margin={1.25}>
            <RefitOnChange deps={fitDeps} />
            <FloatingGroup>
              <CubeKube {...props} />
            </FloatingGroup>
          </Bounds>

          <ContactShadows
            position={[0, contactY - 0.05, 0]}
            opacity={0.28}
            scale={9}
            blur={2.6}
            far={5}
            resolution={1024}
          />

          {/* Environnement procédural : reflets de glaçure qui glissent sur les
              carreaux à la rotation. 4 formeurs + un rimlight rasant pour faire
              briller les arêtes biseautées et révéler la texture de surface. */}
          <Environment resolution={256} environmentIntensity={0.78}>
            <Lightformer intensity={2.6} position={[0, 4, 2]} scale={[8, 4, 1]} color="#ffffff" />
            <Lightformer intensity={1.4} position={[-4, 1, 3]} scale={[3, 6, 1]} color="#fff6e8" />
            <Lightformer intensity={1.4} position={[4, 2, -3]} scale={[3, 6, 1]} color="#eef3ff" />
            <Lightformer intensity={0.9} position={[0, -3, 0]} scale={[8, 4, 1]} color="#ffffff" />
            <Lightformer intensity={1.8} position={[3, 0, 5]} scale={[2, 8, 1]} color="#ffffff" />
          </Environment>
        </Suspense>

        {/* Rotation libre souris/doigt + rotation auto lente au repos. */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={enableZoom}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI - 0.15}
          autoRotate
          autoRotateSpeed={0.55}
          enableDamping
          dampingFactor={0.12}
        />
      </Canvas>
    </div>
  );
}
