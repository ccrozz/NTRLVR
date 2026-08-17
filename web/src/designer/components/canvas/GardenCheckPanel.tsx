import { useMemo, useState } from "react";
import { designerStateConfig } from "@lib/designer-states";
import { useDesignerStore } from "../../store/useDesignerStore";
import {
  buildGardenChecks,
  defaultZoneForState,
  directionAngle,
  directionLabel,
  northFromSunset,
  zoneChoicesForState,
  type ScreenDirection,
} from "../../lib/garden-check";

/** 3x3 compass pad; the middle cell reports where north ends up. */
const COMPASS_ROWS: (ScreenDirection | "center")[][] = [
  ["up-left", "up", "up-right"],
  ["left", "center", "right"],
  ["down-left", "down", "down-right"],
];

const DIRECTION_TITLES: Record<ScreenDirection, string> = {
  up: "Sun sets past the top edge",
  "up-right": "Sun sets past the top right corner",
  right: "Sun sets past the right edge",
  "down-right": "Sun sets past the bottom right corner",
  down: "Sun sets past the bottom edge",
  "down-left": "Sun sets past the bottom left corner",
  left: "Sun sets past the left edge",
  "up-left": "Sun sets past the top left corner",
};

function DirectionArrow({ dir }: { dir: ScreenDirection }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      style={{ transform: `rotate(${directionAngle(dir)}deg)` }}
    >
      <path
        d="M8 13V3.5M8 3.5 4.75 6.75M8 3.5l3.25 3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GardenCheckPanel() {
  const open = useDesignerStore((s) => s.gardenCheckOpen);
  const setOpen = useDesignerStore((s) => s.setGardenCheckOpen);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const designerState = useDesignerStore((s) => s.designerState);
  const sunsetDirection = useDesignerStore((s) => s.sunsetDirection);
  const setSunsetDirection = useDesignerStore((s) => s.setSunsetDirection);
  const hardinessZone = useDesignerStore((s) => s.hardinessZone);
  const setHardinessZone = useDesignerStore((s) => s.setHardinessZone);
  const [editingZone, setEditingZone] = useState(false);

  const stateConfig = designerStateConfig(designerState);
  const zoneChoices = useMemo(
    () => zoneChoicesForState(designerState),
    [designerState],
  );

  const checks = useMemo(
    () =>
      buildGardenChecks({
        plants: canvasPlants,
        zones,
        state: designerState,
        sunsetDirection,
      }),
    [canvasPlants, zones, designerState, sunsetDirection],
  );

  const openIssues = checks.filter((c) => c.severity !== "ok").length;

  if (!open) {
    return (
      <button
        type="button"
        className="designer-garden-check-reopen"
        onClick={() => setOpen(true)}
        aria-label="Show garden check"
      >
        <span>Garden check</span>
        {openIssues > 0 && (
          <span className="designer-garden-check-reopen-count">{openIssues}</span>
        )}
      </button>
    );
  }

  const north = sunsetDirection ? northFromSunset(sunsetDirection) : null;

  return (
    <aside className="designer-garden-check" aria-label="Garden check">
      <header className="designer-garden-check-head">
        <h2>Garden check</h2>
        <button
          type="button"
          className="designer-garden-check-close"
          onClick={() => setOpen(false)}
          aria-label="Hide garden check"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <path
              d="m4 4 8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <p className="designer-garden-check-intro">
        Spacing, beds, layers and sun are reviewed here as you design.
      </p>

      <section className="designer-garden-check-section">
        <h3>Location &amp; climate</h3>
        <div className="designer-garden-check-row">
          <span className="designer-garden-check-row-icon" aria-hidden>
            <svg viewBox="0 0 16 16" width="13" height="13">
              <path
                d="M8 1.75c-2.35 0-4.25 1.85-4.25 4.13C3.75 9.4 8 14.25 8 14.25s4.25-4.85 4.25-8.37c0-2.28-1.9-4.13-4.25-4.13z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="5.9" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="designer-garden-check-row-text">
            {stateConfig?.name ?? designerState}
            {hardinessZone ? ` · Zone ${hardinessZone}` : " · Zone not set"}
          </span>
          <button
            type="button"
            className="designer-garden-check-set"
            onClick={() => setEditingZone((v) => !v)}
            aria-expanded={editingZone}
          >
            {editingZone ? "Done" : hardinessZone ? "Change" : "Set"}
          </button>
        </div>
        {editingZone && (
          <div className="designer-garden-check-zones" role="group" aria-label="Hardiness zone">
            {zoneChoices.map((zone) => (
              <button
                key={zone}
                type="button"
                className={`designer-garden-check-zone${hardinessZone === zone ? " is-active" : ""}`}
                onClick={() => {
                  setHardinessZone(zone);
                  setEditingZone(false);
                }}
              >
                {zone}
              </button>
            ))}
            <button
              type="button"
              className="designer-garden-check-zone-guess"
              onClick={() => {
                setHardinessZone(defaultZoneForState(designerState));
                setEditingZone(false);
              }}
            >
              Use {defaultZoneForState(designerState)}
            </button>
          </div>
        )}
      </section>

      <section className="designer-garden-check-section">
        <h3 className={sunsetDirection ? undefined : "has-alert"}>
          {sunsetDirection ? "Sun direction" : "Which way does the sun set?"}
        </h3>
        <p className="designer-garden-check-hint">
          Click the edge of your plan where the sun goes down — shade and sun
          checks follow it.
        </p>
        <div className="designer-garden-check-compass" role="group" aria-label="Sunset direction">
          {COMPASS_ROWS.flat().map((cell, i) =>
            cell === "center" ? (
              <span
                key={`center-${i}`}
                className="designer-garden-check-compass-center"
                aria-hidden
              >
                {north ? (
                  <>
                    <span>N</span>
                    <DirectionArrow dir={north} />
                  </>
                ) : (
                  <span className="is-muted">N</span>
                )}
              </span>
            ) : (
              <button
                key={cell}
                type="button"
                className={`designer-garden-check-compass-btn${sunsetDirection === cell ? " is-active" : ""}`}
                onClick={() =>
                  setSunsetDirection(sunsetDirection === cell ? null : cell)
                }
                aria-pressed={sunsetDirection === cell}
                title={DIRECTION_TITLES[cell]}
              >
                <DirectionArrow dir={cell} />
              </button>
            ),
          )}
        </div>
        <p className="designer-garden-check-note">
          {north
            ? `North points to the ${directionLabel(north)} of your plan.`
            : "Pick a direction to orient shadows and sun checks."}
        </p>
      </section>

      <section className="designer-garden-check-section">
        <h3>
          Checks
          {openIssues > 0 && (
            <span className="designer-garden-check-badge">{openIssues}</span>
          )}
        </h3>
        <ul className="designer-garden-check-list">
          {checks.map((check) => (
            <li key={check.id} className={`is-${check.severity}`}>
              <span className="designer-garden-check-dot" aria-hidden />
              <span className="designer-garden-check-item-text">
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
