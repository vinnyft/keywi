// Canvas-based tile texture generation for Three.js faces.
// Each call produces pixel data for a BoxGeometry face.
// This avoids per-tile mesh instances and handles thousands of tiles at 60fps.

// Mulberry32 — fast, deterministic PRNG sufficient for tile distribution
function mulberry32(seed: number) {
  return function () {
    let s = (seed += 0x6d2b79f5);
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

// Distribute colors evenly then shuffle with seeded random
export function distributeCouleurs(
  total: number,
  couleurs: string[],
  seed: number
): string[] {
  if (couleurs.length === 0) return [];
  if (couleurs.length === 1) return Array(total).fill(couleurs[0]);

  const rand = mulberry32(seed);
  const nb = couleurs.length;
  const result: string[] = [];

  const perColor = Math.floor(total / nb);
  for (let i = 0; i < nb; i++) {
    const count = i < nb - 1 ? perColor : total - result.length;
    for (let j = 0; j < count; j++) result.push(couleurs[i]);
  }

  // Fisher-Yates with seeded random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export interface FaceTextureOptions {
  tilesX: number;     // tiles along horizontal axis of this face
  tilesY: number;     // tiles along vertical axis of this face
  tileColors: string[]; // flat array of hex colors, length = tilesX * tilesY
  groutColor: string;
  resolution?: number;  // canvas pixels per tile side (default: 32, capped at 64)
}

// Returns a canvas with the face texture drawn on it.
// Caller wraps it in THREE.CanvasTexture.
export function drawFaceTexture(
  canvas: HTMLCanvasElement,
  opts: FaceTextureOptions
): void {
  const { tilesX, tilesY, tileColors, groutColor } = opts;
  const res = Math.min(opts.resolution ?? 32, 64);

  const W = tilesX * res;
  const H = tilesY * res;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Joint background
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, W, H);

  // Grout inset — 12% of tile size on each side
  const inset = Math.max(1, Math.round(res * 0.12));

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const color = tileColors[ty * tilesX + tx] ?? groutColor;
      ctx.fillStyle = color;
      ctx.fillRect(
        tx * res + inset,
        ty * res + inset,
        res - inset * 2,
        res - inset * 2
      );
    }
  }
}

// Generate all 6 face textures for a KUBE box.
// Faces: +x right, -x left, +y top, -y bottom, +z front, -z back
// (BoxGeometry material order)
export interface KubeFaceConfig {
  couleurs: string[];
  couleurJoint: string;
  nbLongueur: number;
  nbLargeur: number;
  nbHauteur: number; // derived: round(hauteurCm / tailleCm)
  seed: number;
  dessousCarrelee: boolean;
}

export function genererTexturesFaces(config: KubeFaceConfig): {
  canvases: HTMLCanvasElement[]; // [+x, -x, +y, -y, +z, -z]
} {
  const { couleurs, couleurJoint, nbLongueur, nbLargeur, nbHauteur, seed, dessousCarrelee } = config;

  // Resolution capped for performance
  const totalTiles = (nbLongueur * nbLargeur) * 2 + (nbLongueur + nbLargeur) * 2 * nbHauteur;
  const res = totalTiles > 2000 ? 16 : totalTiles > 500 ? 24 : 32;

  function makeFace(tilesX: number, tilesY: number, faceSeedOffset: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const total = tilesX * tilesY;
    const colors = distributeCouleurs(total, couleurs, seed + faceSeedOffset);
    drawFaceTexture(canvas, { tilesX, tilesY, tileColors: colors, groutColor: couleurJoint, resolution: res });
    return canvas;
  }

  // Face order for BoxGeometry: right(+x), left(-x), top(+y), bottom(-y), front(+z), back(-z)
  const canvases: HTMLCanvasElement[] = [
    makeFace(nbHauteur, nbLargeur, 0),    // +x right:  depth × width
    makeFace(nbHauteur, nbLargeur, 100),   // -x left
    makeFace(nbLongueur, nbLargeur, 200),  // +y top
    dessousCarrelee
      ? makeFace(nbLongueur, nbLargeur, 300)
      : makeFace(1, 1, 300),               // -y bottom (untiled = 1 plain tile)
    makeFace(nbLongueur, nbHauteur, 400),  // +z front: length × height
    makeFace(nbLongueur, nbHauteur, 500),  // -z back
  ];

  return { canvases };
}
