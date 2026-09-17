"use client";

import { QRCodeSVG } from "qrcode.react";

/** QR du code de retrait (pour scan à la borne / au comptoir). */
export function QrRetrait({ code }: { code: string }) {
  return (
    <div className="inline-block rounded-xl border border-gray-200 bg-white p-3">
      <QRCodeSVG value={`KEYWE:${code}`} size={160} aria-label={`QR ${code}`} />
    </div>
  );
}
