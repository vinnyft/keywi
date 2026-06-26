"use client";

import dynamic from "next/dynamic";

const ConfigurateurScene = dynamic(
  () => import("./ConfigurateurScene").then((m) => m.ConfigurateurScene),
  { ssr: false }
);

export function AccueilCube() {
  return (
    <div className="w-full h-full" style={{ minHeight: 320 }}>
      <ConfigurateurScene
        tailleCm={5}
        nbLongueur={8}
        nbLargeur={6}
        nbHauteur={9}
        couleurs={["#F5F0E8", "#1A1A1A", "#C4714A"]}
        couleurJoint="#888888"
        seed={42}
        dessousCarrelee={false}
        enableZoom={false}
      />
    </div>
  );
}
