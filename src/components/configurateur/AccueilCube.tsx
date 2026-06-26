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
        couleurs={["#232C66", "#5E7A3C", "#C99A3A", "#B23A2E"]}
        couleurJoint="#F3EFE7"
        motif="aleatoire"
        seed={42}
        dessousCarrelee={false}
        enableZoom={false}
      />
    </div>
  );
}
