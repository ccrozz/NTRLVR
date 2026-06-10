/** Musical-instrument thumbnails wrongly matched to plant genera (Viola → Bratsche). */
const REJECTED_PLANT_IMAGE_URL =
  /\b(bratsche|violin|viola[_-]?scroll|cello|contrabass|fiddle|mandolin)\b/i;

export function isRejectedPlantImageUrl(
  url: string | null | undefined,
): boolean {
  if (!url?.trim()) return false;
  return REJECTED_PLANT_IMAGE_URL.test(url);
}
