import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_GARDEN_PREFERENCES,
  type GardenPreferences,
  type PlantingDensity,
} from "@lib/food-forest-questionnaire";
import {
  defaultRegionForDesignerState,
  hardinessZoneForStateRegion,
} from "@lib/state-onboarding-regions";
import { PLANTING_DENSITY_OPTIONS } from "../../lib/garden-questionnaire-ui";
import { completeEnhanceGuildPlan } from "../../lib/garden-enhance-run";
import {
  countFruitTreesInZone,
  pickEnhanceZone,
  zoneNeedsGuildEnhance,
} from "../../lib/enhance-zone";
import { canvasPlantsInZone } from "../../lib/zone-plant-groups";
import { zoneLayoutDimensions } from "../../lib/zone-geometry";
import { zoneSummary } from "../../lib/zone-summary";
import { useDesignerStore } from "../../store/useDesignerStore";
import { BuildLoading } from "./BuildLoading";
import { EnhanceGuildResults } from "./EnhanceGuildResults";

const ENHANCE_STEP_COUNT = 3;

type Phase = "question" | "generating" | "results";

export function EnhanceGuildFlow() {
  const designerState = useDesignerStore((s) => s.designerState);
  const zones = useDesignerStore((s) => s.zones);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);
  const applyEnhancePlan = useDesignerStore((s) => s.applyEnhancePlan);
  const resetEnhanceGuild = useDesignerStore((s) => s.resetEnhanceGuild);
  const enhanceResultsReady = useDesignerStore((s) => s.enhanceResultsReady);

  const [phase, setPhase] = useState<Phase>(() =>
    enhanceResultsReady ? "results" : "question",
  );
  const [qIndex, setQIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [density, setDensity] = useState<PlantingDensity>("balanced");
  const [userNotes, setUserNotes] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    activeZoneId,
  );

  const stateRegion = defaultRegionForDesignerState(designerState);
  const hardinessZone = hardinessZoneForStateRegion(designerState, stateRegion);

  const enhanceZone = useMemo(() => {
    if (selectedZoneId) {
      return zones.find((z) => z.id === selectedZoneId) ?? null;
    }
    return pickEnhanceZone(
      canvasPlants,
      zones,
      activeZoneId,
      designerState,
    );
  }, [selectedZoneId, zones, canvasPlants, activeZoneId, designerState]);

  const zonePlants = useMemo(
    () =>
      enhanceZone
        ? canvasPlantsInZone(canvasPlants, enhanceZone, zones)
        : [],
    [enhanceZone, canvasPlants, zones],
  );

  const treeCount = useMemo(
    () =>
      enhanceZone
        ? countFruitTreesInZone(
            canvasPlants,
            enhanceZone,
            zones,
            designerState,
          )
        : 0,
    [enhanceZone, canvasPlants, zones, designerState],
  );

  const canEnhance = canvasPlants.length > 0 && enhanceZone != null;

  const runGenerate = useCallback(async () => {
    if (!enhanceZone) return;
    setPhase("generating");
    setError(null);
    try {
      const preferences: GardenPreferences = {
        ...DEFAULT_GARDEN_PREFERENCES,
        gardenStyle: "food_forest",
        density,
        uses: ["fresh_fruit", "wildlife_pollinators", "perennial_staples"],
        priorities: ["nitrogen_fixers", "groundcover_mulch", "root_crops"],
      };
      const plan = await completeEnhanceGuildPlan({
        zone: enhanceZone,
        zones,
        canvasPlants,
        hardinessZone,
        designerState,
        preferences,
        userNotes: userNotes.trim() || undefined,
        treeCount,
      });
      applyEnhancePlan(plan);
      setPhase("results");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not complete your guild.",
      );
      setPhase("question");
    }
  }, [
    enhanceZone,
    zones,
    canvasPlants,
    hardinessZone,
    designerState,
    density,
    userNotes,
    treeCount,
    applyEnhancePlan,
  ]);

  if (phase === "generating") {
    return (
      <div className="sidebar-build-scroll">
        <BuildLoading />
      </div>
    );
  }

  if (phase === "results" && enhanceResultsReady) {
    return (
      <div className="sidebar-build-scroll sidebar-build-scroll--results">
        <EnhanceGuildResults />
      </div>
    );
  }

  const dims = enhanceZone ? zoneLayoutDimensions(enhanceZone) : null;

  return (
    <div className="sidebar-build">
      <header className="sidebar-build-head">
        <h2 className="sidebar-build-q">Complete your guild</h2>
        <p className="sidebar-build-sub">
          Step {qIndex + 1} of {ENHANCE_STEP_COUNT}
        </p>
        <button
          type="button"
          className="sidebar-build-reset-inline"
          onClick={() => resetEnhanceGuild()}
        >
          Start over
        </button>
      </header>

      <div className="sidebar-build-scroll">
        {error && (
          <p className="sidebar-build-error" role="alert">
            {error}
          </p>
        )}

        {qIndex === 0 && (
          <div className="sidebar-build-body">
            <p className="sidebar-build-hint">
              We&apos;ll read what&apos;s already on your canvas and suggest
              shrubs, herbs, and groundcovers to fill in the food forest —
              without moving your trees.
            </p>
            {!canEnhance && (
              <p className="sidebar-build-error">
                Place at least one plant on the canvas first, ideally fruit
                trees in a garden bed.
              </p>
            )}
            {zones.length > 1 && (
              <>
                <p className="sidebar-build-hint">Which bed?</p>
                <div className="sidebar-build-segment sidebar-build-segment--2">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      className={`sidebar-build-segment-btn${selectedZoneId === zone.id || (!selectedZoneId && activeZoneId === zone.id) ? " is-on" : ""}`}
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        setActiveZoneId(zone.id);
                      }}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            {enhanceZone && (
              <div className="sidebar-build-hint">
                <strong>{enhanceZone.name}</strong>
                {dims && (
                  <>
                    {" "}
                    · {Math.round(dims.widthFeet)}×{Math.round(dims.heightFeet)}{" "}
                    ft
                  </>
                )}
                <br />
                {zonePlants.length} plant{zonePlants.length === 1 ? "" : "s"} on
                canvas
                {treeCount > 0 && (
                  <>
                    {" "}
                    · {treeCount} fruit tree{treeCount === 1 ? "" : "s"}
                  </>
                )}
                {enhanceZone &&
                  zoneNeedsGuildEnhance(
                    canvasPlants,
                    enhanceZone,
                    zones,
                    designerState,
                  ) && (
                    <>
                      <br />
                      Looks like a good candidate for understory plants.
                    </>
                  )}
                <br />
                <span className="sidebar-build-sub">{zoneSummary(enhanceZone)}</span>
              </div>
            )}
          </div>
        )}

        {qIndex === 1 && (
          <div className="sidebar-build-body">
            <p className="sidebar-build-hint">
              How full should the understory be?
            </p>
            <div className="sidebar-build-segment">
              {PLANTING_DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`sidebar-build-segment-btn${density === opt.id ? " is-on" : ""}`}
                  onClick={() => setDensity(opt.id)}
                >
                  {opt.title}
                </button>
              ))}
            </div>
            <p className="sidebar-build-sub">
              {PLANTING_DENSITY_OPTIONS.find((o) => o.id === density)?.description}
            </p>
          </div>
        )}

        {qIndex === 2 && (
          <div className="sidebar-build-body">
            <p className="sidebar-build-hint">
              Anything specific for your yard? (optional)
            </p>
            <textarea
              className="sidebar-build-dim-field sidebar-build-notes"
              rows={4}
              placeholder="e.g. I have Glenn mango and Hass avocado — want comfrey and sweet potato, no thorny plants"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
            />
            <p className="sidebar-build-sub">
              AI uses this with your existing trees to tailor companion picks.
            </p>
          </div>
        )}
      </div>

      <footer className="sidebar-build-foot">
        {qIndex > 0 && (
          <button
            type="button"
            className="sidebar-build-back"
            onClick={() => setQIndex((i) => i - 1)}
          >
            Back
          </button>
        )}
        {qIndex < ENHANCE_STEP_COUNT - 1 ? (
          <button
            type="button"
            className="sidebar-build-continue"
            disabled={!canEnhance}
            onClick={() => setQIndex((i) => i + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-build-continue"
            disabled={!canEnhance}
            onClick={() => void runGenerate()}
          >
            Complete guild
          </button>
        )}
      </footer>
    </div>
  );
}
