import { useCallback, useEffect, useState } from "react";
import type {
  GardenOnboardingAnswers,
  MaintenanceLevel,
  OnboardingExperience,
  OnboardingGoal,
  OnboardingSpaceSource,
  OnboardingSunlight,
  OnboardingWater,
  PropertyType,
  SpaceSize,
} from "@lib/garden-onboarding";
import {
  ONBOARDING_GOAL_LABELS,
  SPACE_SIZE_COMPARISONS,
  spaceDimensions,
  spaceSizeLabel,
} from "@lib/garden-onboarding";
import { nativesGroupLabel } from "@lib/food-forest-groups";
import {
  defaultRegionForDesignerState,
  hardinessZoneForStateRegion,
  isStateRegionId,
  regionStepTitle,
  regionsForDesignerState,
  stateRegionById,
} from "@lib/state-onboarding-regions";
import { countCanvasPlantsInZone } from "../../lib/zone-plant-groups";
import { zoneLayoutDimensions } from "../../lib/zone-geometry";
import { zoneSummary } from "../../lib/zone-summary";
import type { GardenStyle, PlantingDensity } from "@lib/food-forest-questionnaire";
import { defaultDensityForGardenStyle } from "@lib/food-forest-questionnaire";
import {
  GARDEN_STYLE_OPTIONS,
  PLANTING_DENSITY_OPTIONS,
} from "../../lib/garden-questionnaire-ui";
import { completeGardenPlan } from "../../lib/garden-onboarding-run";
import { createFreshQuestionnaireDraft } from "../../lib/questionnaire-draft";
import { useDesignerStore } from "../../store/useDesignerStore";
import { BuildLoading } from "./BuildLoading";
import { BuildForMeResults } from "./BuildForMeResults";
import { StepDots, STEP_COUNT } from "./StepDots";

const API = import.meta.env.VITE_API_URL ?? "";

const GOALS: OnboardingGoal[] = [
  "food_production",
  "wildlife",
  "medicinal",
  "savings",
  "regenerative",
  "aesthetic",
  "pollinator",
  "low_maintenance",
];

const BASE_PREFERENCE_PILLS: { id: string; label: string }[] = [
  { id: "florida_natives", label: "State natives only" },
  { id: "no_invasive", label: "No invasive species" },
  { id: "kid_friendly", label: "Kid-friendly plants" },
  { id: "pet_safe", label: "Pet-safe plants" },
  { id: "kitchen_herbs", label: "Kitchen herbs and edibles" },
  { id: "year_round_color", label: "Year-round color" },
  { id: "want_shade", label: "I want shade eventually" },
  { id: "windbreak", label: "Windbreak" },
  { id: "medicinal_plants", label: "Medicinal plants" },
  { id: "beneficial_predators", label: "Lizards and frogs" },
];

const SPACE_OPTIONS: { id: SpaceSize; label: string }[] = [
  { id: "tiny", label: "Tiny" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

const SUN_OPTIONS: { id: OnboardingSunlight; label: string }[] = [
  { id: "full", label: "Full sun" },
  { id: "partial", label: "Partial" },
  { id: "dappled", label: "Dappled" },
  { id: "shade", label: "Shade" },
];

function parseFeetInput(raw: string, fallback: number): number {
  const n = parseFloat(raw.trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(80, Math.max(6, n));
}

function inferSpaceSizeFromArea(areaSqFt: number): SpaceSize {
  if (areaSqFt < 120) return "tiny";
  if (areaSqFt < 280) return "small";
  if (areaSqFt < 700) return "medium";
  return "large";
}

function defaultGoalsForStyle(style: GardenStyle): OnboardingGoal[] {
  switch (style) {
    case "kitchen_garden":
      return ["food_production", "savings"];
    case "pollinator":
      return ["pollinator", "wildlife"];
    case "visual":
      return ["aesthetic"];
    case "easy_care":
      return ["low_maintenance"];
    default:
      return ["food_production", "regenerative"];
  }
}

type Phase = "question" | "generating" | "results";

export function BuildForMeFlow() {
  const storedDraft = useDesignerStore((s) => s.questionnaireDraft);
  const setQuestionnaireDraft = useDesignerStore((s) => s.setQuestionnaireDraft);
  const applyGardenPlan = useDesignerStore((s) => s.applyGardenPlan);
  const resetBuildForMe = useDesignerStore((s) => s.resetBuildForMe);
  const buildResultsReady = useDesignerStore((s) => s.buildResultsReady);
  const designerState = useDesignerStore((s) => s.designerState);
  const zones = useDesignerStore((s) => s.zones);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);

  const initial =
    storedDraft ?? createFreshQuestionnaireDraft(designerState);
  const [phase, setPhase] = useState<Phase>(() =>
    buildResultsReady ? "results" : "question",
  );
  const [qIndex, setQIndex] = useState(initial.qIndex);

  useEffect(() => {
    if (buildResultsReady) {
      setPhase((p) => (p === "generating" ? p : "results"));
    } else {
      setPhase((p) => (p === "results" ? "question" : p));
    }
  }, [buildResultsReady]);
  const [error, setError] = useState<string | null>(null);

  const [gardenStyle, setGardenStyle] = useState<GardenStyle>(
    initial.answers.garden_style ?? "food_forest",
  );
  const [stateRegion, setStateRegion] = useState<string>(() => {
    const fromDraft =
      initial.answers.state_region ?? initial.answers.florida_region;
    if (fromDraft && isStateRegionId(designerState, fromDraft)) return fromDraft;
    return defaultRegionForDesignerState(designerState);
  });

  useEffect(() => {
    if (isStateRegionId(designerState, stateRegion)) return;
    setStateRegion(defaultRegionForDesignerState(designerState));
  }, [designerState, stateRegion]);

  const hardinessZone = hardinessZoneForStateRegion(designerState, stateRegion);
  const stateRegions = regionsForDesignerState(designerState);
  const preferencePills = BASE_PREFERENCE_PILLS.map((pill) =>
    pill.id === "florida_natives"
      ? {
          ...pill,
          label: `${nativesGroupLabel(designerState)} only`,
        }
      : pill,
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initial.answers.property_type ?? "yard",
  );
  const [spaceSize, setSpaceSize] = useState<SpaceSize>(
    initial.answers.space_size ?? "medium",
  );
  const [spaceSource, setSpaceSource] = useState<OnboardingSpaceSource>(
    initial.answers.space_source ??
      (initial.canvas_zone_id || zones.length > 0 ? "canvas_zone" : "preset"),
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    initial.canvas_zone_id ??
      initial.answers.canvas_zone_id ??
      null,
  );
  const [customWidth, setCustomWidth] = useState(
    String(initial.answers.bed_width_feet ?? 20),
  );
  const [customHeight, setCustomHeight] = useState(
    String(initial.answers.bed_height_feet ?? 20),
  );
  const [goals, setGoals] = useState<OnboardingGoal[]>(
    initial.answers.goals ?? defaultGoalsForStyle("food_forest"),
  );
  const [sunlight, setSunlight] = useState<OnboardingSunlight>(
    initial.answers.sunlight ?? "full",
  );
  const [sunPlantCount, setSunPlantCount] = useState<number | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceLevel>(
    initial.answers.maintenance ?? "moderate",
  );
  const [water, setWater] = useState<OnboardingWater>(
    initial.answers.water ?? "hand_water",
  );
  const [preferences, setPreferences] = useState<string[]>(
    initial.answers.preferences ?? [],
  );
  const [experience, setExperience] = useState<OnboardingExperience>(
    initial.answers.experience ?? "intermediate",
  );
  const [plantingDensity, setPlantingDensity] = useState<PlantingDensity>(
    initial.answers.planting_density ??
      defaultDensityForGardenStyle(
        initial.answers.garden_style ?? "food_forest",
      ),
  );

  useEffect(() => {
    if (qIndex !== 3 || zones.length === 0) return;
    if (spaceSource === "canvas_zone" && !selectedZoneId) {
      setSelectedZoneId(activeZoneId ?? zones[0]?.id ?? null);
    }
  }, [qIndex, zones, activeZoneId, spaceSource, selectedZoneId]);

  const persistDraft = useCallback(() => {
    const bed = resolveBedSelection();
    setQuestionnaireDraft({
      qIndex,
      canvas_zone_id:
        spaceSource === "canvas_zone" ? selectedZoneId : null,
      answers: {
        garden_style: gardenStyle,
        property_type: propertyType,
        space_size: bed.spaceSize,
        space_source: bed.source,
        bed_width_feet: bed.widthFeet,
        bed_height_feet: bed.heightFeet,
        canvas_zone_id: bed.zoneId,
        goals,
        sunlight,
        maintenance,
        water,
        preferences,
        experience,
        designer_state: designerState,
        state_region: stateRegion,
        florida_region:
          designerState === "FL"
            ? (stateRegion as GardenOnboardingAnswers["florida_region"])
            : undefined,
        hardiness_zone: hardinessZone,
        planting_density: plantingDensity,
      },
    });
  }, [
    qIndex,
    gardenStyle,
    designerState,
    stateRegion,
    hardinessZone,
    propertyType,
    spaceSize,
    spaceSource,
    selectedZoneId,
    customWidth,
    customHeight,
    zones,
    goals,
    plantingDensity,
    sunlight,
    maintenance,
    water,
    preferences,
    experience,
    setQuestionnaireDraft,
  ]);

  function resolveBedSelection(): {
    source: OnboardingSpaceSource;
    widthFeet: number;
    heightFeet: number;
    spaceSize: SpaceSize;
    zoneId?: string;
  } {
    if (spaceSource === "canvas_zone" && selectedZoneId) {
      const z = zones.find((zone) => zone.id === selectedZoneId);
      if (z) {
        const dims = zoneLayoutDimensions(z);
        const area = dims.widthFeet * dims.heightFeet;
        return {
          source: "canvas_zone",
          widthFeet: dims.widthFeet,
          heightFeet: dims.heightFeet,
          spaceSize: inferSpaceSizeFromArea(area),
          zoneId: z.id,
        };
      }
    }
    if (spaceSource === "custom_feet") {
      const w = parseFeetInput(customWidth, 20);
      const h = parseFeetInput(customHeight, 20);
      return {
        source: "custom_feet",
        widthFeet: w,
        heightFeet: h,
        spaceSize: inferSpaceSizeFromArea(w * h),
      };
    }
    const dims = spaceDimensions(spaceSize, propertyType);
    return {
      source: "preset",
      widthFeet: dims.widthFeet,
      heightFeet: dims.heightFeet,
      spaceSize,
    };
  }

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  useEffect(() => {
    if (qIndex !== 6) return;
    let cancelled = false;
    fetch(
      `${API}/api/garden/sunlight-count?sunlight=${sunlight}&hardiness_zone=${encodeURIComponent(hardinessZone)}&state=${designerState}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) {
          setSunPlantCount((j as { data: { count: number } }).data.count);
        }
      })
      .catch(() => {
        if (!cancelled) setSunPlantCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qIndex, sunlight, hardinessZone, designerState]);

  function buildAnswers(): GardenOnboardingAnswers {
    const bed = resolveBedSelection();
    return {
      garden_style: gardenStyle,
      property_type: propertyType,
      space_size: bed.spaceSize,
      space_source: bed.source,
      bed_width_feet: bed.widthFeet,
      bed_height_feet: bed.heightFeet,
      canvas_zone_id: bed.zoneId,
      goals,
      sunlight,
      maintenance,
      water,
      preferences,
      experience,
      designer_state: designerState,
      state_region: stateRegion,
      florida_region:
        designerState === "FL"
          ? (stateRegion as GardenOnboardingAnswers["florida_region"])
          : undefined,
      hardiness_zone: hardinessZone,
      planting_density: plantingDensity,
    };
  }

  async function runGenerate() {
    setPhase("generating");
    setError(null);
    const answers = buildAnswers();
    try {
      const [payload] = await Promise.all([
        completeGardenPlan(answers),
        new Promise<void>((r) => setTimeout(r, 2600)),
      ]);
      applyGardenPlan({
        ...payload,
        canvasZoneId: answers.canvas_zone_id ?? null,
      });
      setPhase("results");
    } catch (e) {
      setPhase("question");
      setQIndex(STEP_COUNT - 1);
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function advance() {
    if (qIndex >= STEP_COUNT - 1) {
      void runGenerate();
      return;
    }
    setQIndex((i) => i + 1);
    setError(null);
  }

  function back() {
    setError(null);
    if (qIndex > 0) setQIndex((i) => i - 1);
  }

  function toggleGoal(g: OnboardingGoal) {
    setGoals((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 3) return prev;
      return [...prev, g];
    });
  }

  function togglePref(id: string) {
    setPreferences((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onStylePick(style: GardenStyle) {
    setGardenStyle(style);
    setGoals(defaultGoalsForStyle(style));
    setPlantingDensity(defaultDensityForGardenStyle(style));
  }

  const canContinue = (() => {
    switch (qIndex) {
      case 0:
        return Boolean(gardenStyle);
      case 1:
        return Boolean(stateRegion);
      case 2:
        return Boolean(propertyType);
      case 3:
        if (spaceSource === "canvas_zone") {
          return Boolean(
            selectedZoneId && zones.some((z) => z.id === selectedZoneId),
          );
        }
        if (spaceSource === "custom_feet") {
          return (
            parseFeetInput(customWidth, 0) >= 6 &&
            parseFeetInput(customHeight, 0) >= 6
          );
        }
        return Boolean(spaceSize);
      case 4:
        return goals.length > 0;
      case 5:
        return Boolean(plantingDensity);
      case 6:
        return Boolean(sunlight);
      case 7:
        return Boolean(maintenance);
      case 8:
        return Boolean(water);
      case 9:
        return true;
      case 10:
        return Boolean(experience);
      default:
        return false;
    }
  })();

  const isMulti = qIndex === 4 || qIndex === 9;
  const regionMeta = stateRegionById(designerState, stateRegion);
  const showFoot = isMulti || canContinue;

  if (phase === "generating") {
    return (
      <div className="sidebar-build-scroll">
        <div className="sidebar-build-head">
          <StepDots current={qIndex} />
          <button
            type="button"
            className="sidebar-build-reset-inline"
            onClick={() => resetBuildForMe()}
          >
            Start over
          </button>
        </div>
        <BuildLoading />
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="sidebar-build-scroll sidebar-build-scroll--results">
        <BuildForMeResults />
      </div>
    );
  }

  return (
    <div className="sidebar-build-scroll">
      <div className="sidebar-build-head">
        <StepDots current={qIndex} />
        {qIndex > 0 && (
          <button
            type="button"
            className="sidebar-build-reset-inline"
            onClick={() => resetBuildForMe()}
          >
            Start over
          </button>
        )}
      </div>

      <div className="sidebar-build-body">
        {qIndex > 0 && (
          <button type="button" className="sidebar-build-back" onClick={back}>
            ← Back
          </button>
        )}

        {qIndex === 0 && (
          <>
            <h2 className="sidebar-build-q">What kind of garden?</h2>
            <p className="sidebar-build-hint">
              We&apos;ll tailor plants and layout to this vibe.
            </p>
            {GARDEN_STYLE_OPTIONS.map((opt) => (
              <SidebarOption
                key={opt.id}
                title={opt.title}
                sub={opt.description}
                selected={gardenStyle === opt.id}
                onClick={() => onStylePick(opt.id)}
              />
            ))}
          </>
        )}

        {qIndex === 1 && (
          <>
            <h2 className="sidebar-build-q">{regionStepTitle(designerState)}</h2>
            <p className="sidebar-build-hint">
              We&apos;ll match plants to your area&apos;s USDA hardiness zone.
            </p>
            {stateRegions.map((region) => (
              <SidebarOption
                key={region.id}
                title={region.label}
                sub={`${region.subtitle} · Zone ${region.hardiness_zone}`}
                selected={stateRegion === region.id}
                onClick={() => setStateRegion(region.id)}
              />
            ))}
          </>
        )}

        {qIndex === 2 && (
          <>
            <h2 className="sidebar-build-q">Your space</h2>
            <p className="sidebar-build-hint">Where are you planting?</p>
            <SidebarOption
              title="Yard or property"
              sub="Backyard, front yard, side yard"
              selected={propertyType === "yard"}
              onClick={() => setPropertyType("yard")}
            />
            <SidebarOption
              title="Patio or balcony"
              sub="Containers and raised beds"
              selected={propertyType === "container"}
              onClick={() => setPropertyType("container")}
            />
            <SidebarOption
              title="Larger plot"
              sub="Half-acre or more"
              selected={propertyType === "land"}
              onClick={() => setPropertyType("land")}
            />
            <SidebarOption
              title="Community space"
              sub="School, church, shared plot"
              selected={propertyType === "community"}
              onClick={() => setPropertyType("community")}
            />
          </>
        )}

        {qIndex === 3 && (
          <>
            <h2 className="sidebar-build-q">How much space?</h2>
            {zones.length > 0 ? (
              <>
                <p className="sidebar-build-hint">
                  Match a bed you drew, or we&apos;ll add a new one beside your
                  layout when you place plants (we won&apos;t wipe other beds).
                </p>
                <div
                  className="sidebar-build-segment sidebar-build-segment--2"
                  role="group"
                  aria-label="Space source"
                >
                  <button
                    type="button"
                    className={`sidebar-build-segment-btn${spaceSource === "canvas_zone" ? " is-on" : ""}`}
                    onClick={() => setSpaceSource("canvas_zone")}
                  >
                    My drawn space
                  </button>
                  <button
                    type="button"
                    className={`sidebar-build-segment-btn${spaceSource === "preset" ? " is-on" : ""}`}
                    onClick={() => setSpaceSource("preset")}
                  >
                    Size estimate
                  </button>
                </div>
                {spaceSource === "canvas_zone" && (
                  <ul className="designer-wizard-zone-pick">
                    {zones.map((z) => {
                      const n = countCanvasPlantsInZone(canvasPlants, z, zones);
                      return (
                        <li key={z.id}>
                          <button
                            type="button"
                            className={`designer-wizard-zone-pick-btn${selectedZoneId === z.id ? " is-on" : ""}`}
                            onClick={() => {
                              setSelectedZoneId(z.id);
                              setActiveZoneId(z.id);
                            }}
                          >
                            <strong>{z.name}</strong>
                            <span>
                              {zoneSummary(z)}
                              {n === 0
                                ? " · Empty — layout sized to this bed"
                                : ` · ${n} plants — placing adds a new bed nearby`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <p className="sidebar-build-hint">
                No bed on the canvas yet — pick a size below, or open{" "}
                <strong>Space</strong> from the ⋯ menu to draw one first.
              </p>
            )}

            {(spaceSource === "preset" || zones.length === 0) && (
              <>
                <p className="sidebar-build-hint">
                  {SPACE_SIZE_COMPARISONS[spaceSize]}
                </p>
                <div
                  className="sidebar-build-segment"
                  role="group"
                  aria-label="Space size"
                >
                  {SPACE_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`sidebar-build-segment-btn${spaceSize === m.id && spaceSource === "preset" ? " is-on" : ""}`}
                      onClick={() => {
                        setSpaceSource("preset");
                        setSpaceSize(m.id);
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="sidebar-build-sub">{spaceSizeLabel(spaceSize)}</p>
              </>
            )}

            <button
              type="button"
              className={`sidebar-build-custom-link${spaceSource === "custom_feet" ? " is-on" : ""}`}
              onClick={() => setSpaceSource("custom_feet")}
            >
              Enter exact feet (W × H)
            </button>
            {spaceSource === "custom_feet" && (
              <div className="sidebar-build-dimensions">
                <label className="sidebar-build-dim-field">
                  <span>Width (ft)</span>
                  <input
                    type="number"
                    min={6}
                    max={80}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                  />
                </label>
                <label className="sidebar-build-dim-field">
                  <span>Height (ft)</span>
                  <input
                    type="number"
                    min={6}
                    max={80}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                  />
                </label>
              </div>
            )}
          </>
        )}

        {qIndex === 4 && (
          <>
            <h2 className="sidebar-build-q">Main goals</h2>
            <p className="sidebar-build-hint">Pick up to three</p>
            {GOALS.map((goalId) => {
              const labels = ONBOARDING_GOAL_LABELS[goalId];
              return (
                <SidebarOption
                  key={goalId}
                  title={labels.title}
                  sub={labels.subtitle}
                  selected={goals.includes(goalId)}
                  disabled={goals.length >= 3 && !goals.includes(goalId)}
                  onClick={() => toggleGoal(goalId)}
                />
              );
            })}
          </>
        )}

        {qIndex === 5 && (
          <>
            <h2 className="sidebar-build-q">How densely planted?</h2>
            <p className="sidebar-build-hint">
              Food forests are often lush and layered — pick what feels right.
            </p>
            {PLANTING_DENSITY_OPTIONS.map((opt) => (
              <SidebarOption
                key={opt.id}
                title={opt.title}
                sub={opt.description}
                selected={plantingDensity === opt.id}
                onClick={() => setPlantingDensity(opt.id)}
              />
            ))}
          </>
        )}

        {qIndex === 6 && (
          <>
            <h2 className="sidebar-build-q">Sunlight</h2>
            <p className="sidebar-build-hint">
              {regionMeta
                ? `${regionMeta.label} · USDA zone ${hardinessZone}. `
                : ""}
              {sunPlantCount != null
                ? `~${sunPlantCount} plants match this light in your zone`
                : "Matching plants to your light…"}
            </p>
            <div className="sidebar-build-segment" role="group" aria-label="Sunlight">
              {SUN_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`sidebar-build-segment-btn${sunlight === s.id ? " is-on" : ""}`}
                  onClick={() => setSunlight(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {qIndex === 7 && (
          <>
            <h2 className="sidebar-build-q">Your time in the garden</h2>
            <SidebarOption
              title="Set it and forget it"
              sub="Plant once, let nature work"
              selected={maintenance === "minimal"}
              onClick={() => setMaintenance("minimal")}
            />
            <SidebarOption
              title="Weekly check-ins"
              sub="30–60 min per week"
              selected={maintenance === "moderate"}
              onClick={() => setMaintenance("moderate")}
            />
            <SidebarOption
              title="Daily tending"
              sub="The garden is my happy place"
              selected={maintenance === "intensive"}
              onClick={() => setMaintenance("intensive")}
            />
          </>
        )}

        {qIndex === 8 && (
          <>
            <h2 className="sidebar-build-q">Water</h2>
            <SidebarOption
              title="Mostly rain"
              sub="No irrigation"
              selected={water === "rain_only"}
              onClick={() => setWater("rain_only")}
            />
            <SidebarOption
              title="Hand water sometimes"
              sub="Hose or can a few times a week"
              selected={water === "hand_water"}
              onClick={() => setWater("hand_water")}
            />
            <SidebarOption
              title="Irrigation"
              sub="Drip or sprinkler on a schedule"
              selected={water === "irrigated"}
              onClick={() => setWater("irrigated")}
            />
          </>
        )}

        {qIndex === 9 && (
          <>
            <h2 className="sidebar-build-q">Anything else?</h2>
            <p className="sidebar-build-hint">Optional — pick any that matter</p>
            <div className="sidebar-build-pills">
              {preferencePills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`sidebar-build-pill${preferences.includes(p.id) ? " is-on" : ""}`}
                  onClick={() => togglePref(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {qIndex === 10 && (
          <>
            <h2 className="sidebar-build-q">Experience level</h2>
            <SidebarOption
              title="Total beginner"
              sub="Be gentle — I&apos;m learning"
              selected={experience === "beginner"}
              onClick={() => setExperience("beginner")}
            />
            <SidebarOption
              title="Some experience"
              sub="Some plants have survived"
              selected={experience === "intermediate"}
              onClick={() => setExperience("intermediate")}
            />
            <SidebarOption
              title="Experienced"
              sub="I know food forests"
              selected={experience === "advanced"}
              onClick={() => setExperience("advanced")}
            />
          </>
        )}

        {error && <p className="sidebar-build-error">{error}</p>}
      </div>

      {showFoot && (
        <div className="sidebar-build-foot">
          <button
            type="button"
            className="sidebar-build-continue"
            disabled={!canContinue}
            onClick={advance}
          >
            {qIndex === STEP_COUNT - 1 ? "Build my garden →" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarOption({
  title,
  sub,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  sub: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sidebar-build-option${selected ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="sidebar-build-option-title">{title}</span>
      <span className="sidebar-build-option-sub">{sub}</span>
    </button>
  );
}
