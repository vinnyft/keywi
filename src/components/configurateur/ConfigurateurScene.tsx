"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CubeKube } from "./CubeKube";

interface SceneContentProps {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number;
  couleurs: string[];
  couleurJoint: string;
  seed: number;
  dessousCarrelee: boolean;
  /** Autoriser le zoom molette/pincement (désactivé pour le cube décoratif d'accueil) */
  enableZoom?: boolean;
}

// Respiration verticale douce du cube flottant
function FloatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });
  return <group ref={groupRef}>{children}</group>;
}

export function ConfigurateurScene({ enableZoom = true, ...props }: SceneContentProps) {
  return (
    <div className="w-full h-full" style={{ touchAction: "none" }}>
      <Canvas
        shadows
        camera={{ position: [3.5, 2.5, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[4, 8, 4]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} />

        <Suspense fallback={null}>
          <FloatingGroup>
            <CubeKube {...props} />
          </FloatingGroup>

          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.15}
            scale={6}
            blur={2.5}
            far={3}
          />

          <Environment preset="city" />
        </Suspense>

        {/* Rotation libre souris/doigt + rotation auto lente au repos */}
        <OrbitControls
          enablePan={false}
          enableZoom={enableZoom}
          minDistance={3}
          maxDistance={9}
          autoRotate
          autoRotateSpeed={0.6}
          enableDamping
          dampingFactor={0.12}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
