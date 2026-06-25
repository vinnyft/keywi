"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
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
}

function FloatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });
  return <group ref={groupRef}>{children}</group>;
}

function MouseParallax({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  return (
    <group
      ref={groupRef}
      onPointerMove={(e) => {
        if (!groupRef.current) return;
        const x = (e.clientX / size.width - 0.5) * 0.3;
        const y = -(e.clientY / size.height - 0.5) * 0.15;
        mouse.current = { x, y };
        groupRef.current.rotation.y += (x - groupRef.current.rotation.y) * 0.05;
      }}
    >
      {children}
    </group>
  );
}

export function ConfigurateurScene(props: SceneContentProps) {
  return (
    <div className="w-full h-full" style={{ touchAction: "none" }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
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
            <CubeKube
              {...props}
              autoRotate
            />
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
      </Canvas>
    </div>
  );
}
