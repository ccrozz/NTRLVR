import type { PlantCategory } from "../../types";

export type CategoryIllustration = {
  paths: string[];
  viewSize: number;
};

const ILLUSTRATIONS: Record<PlantCategory, CategoryIllustration> = {
  "Fruit Tree": {
    viewSize: 48,
    paths: [
      "M24 42 L24 28",
      "M24 28 C14 28 10 18 16 12 C20 8 28 8 32 14 C36 20 32 28 24 28",
    ],
  },
  Citrus: {
    viewSize: 48,
    paths: [
      "M24 42 L24 30",
      "M24 30 C12 30 8 16 18 10 C26 6 34 14 32 24 C30 30 24 30 24 30",
      "M18 22 a3 3 0 1 0 0.1 0",
      "M28 18 a2.5 2.5 0 1 0 0.1 0",
      "M22 14 a2 2 0 1 0 0.1 0",
    ],
  },
  "Tropical Fruit": {
    viewSize: 48,
    paths: [
      "M24 44 L24 14",
      "M24 14 C20 6 28 4 30 12 C32 18 28 22 24 18",
      "M24 18 C22 10 14 8 12 16 C10 22 16 26 24 22",
    ],
  },
  Berry: {
    viewSize: 48,
    paths: [
      "M24 40 L24 26",
      "M16 26 C10 26 8 18 14 14 C18 10 26 12 28 18 C30 24 24 26 16 26",
      "M18 20 a2 2 0 1 0 0.1 0",
      "M26 20 a2 2 0 1 0 0.1 0",
      "M22 16 a1.5 1.5 0 1 0 0.1 0",
    ],
  },
  Herb: {
    viewSize: 48,
    paths: [
      "M24 42 L24 32",
      "M18 32 C14 28 12 22 16 18 C18 14 22 16 24 22",
      "M30 32 C34 28 36 22 32 18 C30 14 26 16 24 22",
      "M24 22 C24 14 20 10 24 6 C28 10 24 14 24 22",
    ],
  },
  Vegetable: {
    viewSize: 48,
    paths: [
      "M24 42 L24 34",
      "M14 34 C10 30 10 22 18 18 C22 16 26 18 28 24 C30 30 22 34 14 34",
      "M34 34 C38 30 38 22 30 18 C26 16 22 18 20 24 C18 30 26 34 34 34",
    ],
  },
  "Ground Cover": {
    viewSize: 48,
    paths: [
      "M8 36 C12 28 16 32 20 26 C24 20 28 26 32 24 C36 22 40 28 40 36",
      "M12 32 C14 28 16 30 18 28",
      "M28 32 C30 28 32 30 34 28",
    ],
  },
  "Support Species": {
    viewSize: 48,
    paths: [
      "M24 42 L24 30",
      "M16 30 C12 24 14 16 22 14 C28 12 34 18 32 26 C30 30 24 30 16 30",
      "M20 22 C18 18 22 16 24 20",
      "M28 22 C30 18 26 16 24 20",
    ],
  },
  Vine: {
    viewSize: 48,
    paths: [
      "M8 38 C16 30 20 34 28 24 C34 16 40 18 42 12",
      "M20 28 C18 24 22 22 24 26",
      "M32 20 C30 16 34 14 36 18",
    ],
  },
  Palm: {
    viewSize: 48,
    paths: [
      "M24 44 L24 22",
      "M24 22 L10 14",
      "M24 22 L38 14",
      "M24 22 L8 20",
      "M24 22 L40 20",
      "M24 22 L14 28",
      "M24 22 L34 28",
    ],
  },
  "Native Shrub": {
    viewSize: 48,
    paths: [
      "M24 42 L24 28",
      "M24 28 C14 28 10 20 16 14 C20 10 28 12 32 18 C34 24 30 28 24 28",
    ],
  },
  "Edible Flower": {
    viewSize: 48,
    paths: [
      "M24 42 L24 32",
      "M24 32 C24 24 18 20 24 14 C30 20 24 24 24 32",
      "M24 20 a4 4 0 1 0 0.1 0",
      "M20 24 a3 3 0 1 0 0.1 0",
      "M28 24 a3 3 0 1 0 0.1 0",
    ],
  },
};

export function getCategoryIllustration(
  category: PlantCategory,
): CategoryIllustration {
  return ILLUSTRATIONS[category] ?? ILLUSTRATIONS["Support Species"];
}

/** Rasterize category SVG for Konva clip (cached per category+color). */
const imageCache = new Map<string, HTMLImageElement>();

export function loadCategoryIllustrationImage(
  category: PlantCategory,
  color: string,
  pixelSize: number,
): Promise<HTMLImageElement | null> {
  const key = `${category}:${color}:${pixelSize}`;
  const cached = imageCache.get(key);
  if (cached) return Promise.resolve(cached);

  const ill = getCategoryIllustration(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ill.viewSize} ${ill.viewSize}" width="${pixelSize}" height="${pixelSize}">
    ${ill.paths.map((d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}
  </svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      imageCache.set(key, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
