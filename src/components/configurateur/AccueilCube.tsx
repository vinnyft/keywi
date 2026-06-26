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
        couleurs={["#002FA7", "#D9A411", "#F2EBDD", "#C8102E"]}
        couleurJoint="#F2EBDD"
        seed={42}
        dessousCarrelee={false}
        enableZoom={false}
      />
    </div>
  );
}
