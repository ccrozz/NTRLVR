import { PX_PER_FOOT } from "./canvas-utils";

const MAJOR_EVERY_FT = 5;
const MIN_MINOR_SPACING_PX = 10;

export type EdgeRulerTick = {
  screen: number;
  feet: number;
  major: boolean;
};

export function horizontalRulerTicks(
  viewportW: number,
  stagePosX: number,
  zoom: number,
  leftInset: number,
): EdgeRulerTick[] {
  const x0 = (-stagePosX - leftInset) / zoom;
  const x1 = (viewportW - stagePosX) / zoom;
  const ftStart = Math.max(0, Math.floor(x0 / PX_PER_FOOT));
  const ftEnd = Math.ceil(x1 / PX_PER_FOOT);
  const footPx = PX_PER_FOOT * zoom;
  const ticks: EdgeRulerTick[] = [];

  for (let ft = ftStart; ft <= ftEnd; ft++) {
    const major = ft % MAJOR_EVERY_FT === 0;
    if (!major && footPx < MIN_MINOR_SPACING_PX) continue;
    const screen = stagePosX + ft * PX_PER_FOOT * zoom;
    if (screen < leftInset - 1 || screen > viewportW + 1) continue;
    ticks.push({ screen, feet: ft, major });
  }
  return ticks;
}

export function verticalRulerTicks(
  viewportH: number,
  stagePosY: number,
  zoom: number,
  topInset: number,
): EdgeRulerTick[] {
  const y0 = (-stagePosY - topInset) / zoom;
  const y1 = (viewportH - stagePosY) / zoom;
  const ftStart = Math.max(0, Math.floor(y0 / PX_PER_FOOT));
  const ftEnd = Math.ceil(y1 / PX_PER_FOOT);
  const footPx = PX_PER_FOOT * zoom;
  const ticks: EdgeRulerTick[] = [];

  for (let ft = ftStart; ft <= ftEnd; ft++) {
    const major = ft % MAJOR_EVERY_FT === 0;
    if (!major && footPx < MIN_MINOR_SPACING_PX) continue;
    const screen = stagePosY + ft * PX_PER_FOOT * zoom;
    if (screen < topInset - 1 || screen > viewportH + 1) continue;
    ticks.push({ screen, feet: ft, major });
  }
  return ticks;
}
