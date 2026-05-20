import { useEffect, useState } from "react";
import {
  GARDEN_STYLE_LABELS,
  buildGardenerProfileText,
  buildWizardPreferences,
  defaultDensityForGardenStyle,
  preferencesFromGardenStyle,
  type GardenExperience,
  type GardenHousehold,
  type GardenPriority,
  type GardenStyle,
  type GardenSun,
  type GardenTime,
  type GardenUse,
  type GardenWater,
  type PlantingDensity,
} from "@lib/food-forest-questionnaire";
import {
  SPACE_PRESETS,
  runAutoPopulate,
  type AutoPopulateAnswers,
} from "../lib/auto-populate";
import {
  CLIMATE_REGION_OPTIONS,
  GARDEN_EXPERIENCE_OPTIONS,
  GARDEN_HOUSEHOLD_OPTIONS,
  GARDEN_PRIORITY_OPTIONS,
  GARDEN_STYLE_OPTIONS,
  GARDEN_SUN_OPTIONS,
  GARDEN_TIME_OPTIONS,
  GARDEN_USE_OPTIONS,
  GARDEN_WATER_OPTIONS,
  PLANTING_DENSITY_OPTIONS,
} from "../lib/garden-questionnaire-ui";
import { zoneLayoutDimensions } from "../lib/zone-geometry";
import { zoneSummary } from "../lib/zone-summary";
import { useDesignerStore } from "../store/useDesignerStore";

type Step = "style" | "goals" | "yard" | "layout";
type SpaceMode = "existing" | "new";

const STEPS: Step[] = ["style", "goals", "yard", "layout"];
const MAX_USES = 4;
const MAX_PRIORITIES = 3;

function parseFeetInput(raw: string, fallback: number): number {
  const n = parseFloat(raw.trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(80, Math.max(6, n));
}

function toggleSelection<T>(current: T[], item: T, max?: number): T[] {
  if (current.includes(item)) return current.filter((x) => x !== item);
  if (max != null && current.length >= max) return current;
  return [...current, item];
}

function applyStyleDefaults(style: GardenStyle) {
  const p = preferencesFromGardenStyle(style);
  return {
    uses: [...p.uses],
    priorities: [...p.priorities],
    time: p.time,
    experience: p.experience,
    sun: p.sun,
    water: p.water,
    household: p.household,
    density: defaultDensityForGardenStyle(style),
  };
}

export function AutoPopulateWizard({
  open,
  onClose,
  hasExistingLayout,
}: {
  open: boolean;
  onClose: () => void;
  hasExistingLayout: boolean;
}) {
  const applyAutoPopulate = useDesignerStore((s) => s.applyAutoPopulate);
  const zones = useDesignerStore((s) => s.zones);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);

  const [step, setStep] = useState<Step>("style");
  const [gardenStyle, setGardenStyle] = useState<GardenStyle>("food_forest");
  const [uses, setUses] = useState<GardenUse[]>([]);
  const [priorities, setPriorities] = useState<GardenPriority[]>([]);
  const [time, setTime] = useState<GardenTime>("few_hours_week");
  const [experience, setExperience] = useState<GardenExperience>("some_experience");
  const [sun, setSun] = useState<GardenSun>("full_sun");
  const [water, setWater] = useState<GardenWater>("occasional");
  const [household, setHousehold] = useState<GardenHousehold>("family");
  const [plantingDensity, setPlantingDensity] =
    useState<PlantingDensity>("balanced");

  const [spaceMode, setSpaceMode] = useState<SpaceMode>("new");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hardinessZone, setHardinessZone] = useState("10a");
  const [presetId, setPresetId] = useState<string>("medium");
  const [widthInput, setWidthInput] = useState("20");
  const [heightInput, setHeightInput] = useState("20");
  const [customSize, setCustomSize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);

  function resetWizardState() {
    const d = applyStyleDefaults("food_forest");
    setStep("style");
    setGardenStyle("food_forest");
    setUses(d.uses);
    setPriorities(d.priorities);
    setTime(d.time);
    setExperience(d.experience);
    setSun(d.sun);
    setWater(d.water);
    setHousehold(d.household);
    setPlantingDensity(d.density);
    setHardinessZone("10a");
    setSpaceMode(zones.length > 0 ? "existing" : "new");
    setSelectedZoneId(activeZoneId ?? zones[0]?.id ?? null);
    setPresetId("medium");
    setCustomSize(false);
    setWidthInput("20");
    setHeightInput("20");
    setReplaceConfirmOpen(false);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    resetWizardState();
  }, [open, zones, activeZoneId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  if (!open) return null;

  const stepIndex = STEPS.indexOf(step);
  const styleMeta = GARDEN_STYLE_OPTIONS.find((s) => s.id === gardenStyle);

  const wizardPreferences = buildWizardPreferences({
    gardenStyle,
    uses,
    priorities,
    time,
    experience,
    sun,
    water,
    household,
    density: plantingDensity,
  });

  const profilePreview = buildGardenerProfileText(wizardPreferences);

  function selectPreset(id: string) {
    setPresetId(id);
    setCustomSize(id === "custom");
    const preset = SPACE_PRESETS.find((p) => p.id === id);
    if (preset) {
      setWidthInput(String(preset.widthFeet));
      setHeightInput(String(preset.heightFeet));
    }
  }

  function selectGardenStyle(style: GardenStyle) {
    setGardenStyle(style);
    const d = applyStyleDefaults(style);
    setUses(d.uses);
    setPriorities(d.priorities);
    setTime(d.time);
    setExperience(d.experience);
    setSun(d.sun);
    setWater(d.water);
    setHousehold(d.household);
    setPlantingDensity(d.density);
  }

  function nextStep() {
    setError(null);
    if (step === "style") setStep("goals");
    else if (step === "goals") {
      if (uses.length === 0) {
        setError("Pick at least one thing you want from your garden.");
        return;
      }
      if (priorities.length === 0) {
        setError("Pick at least one plant focus.");
        return;
      }
      setStep("yard");
    } else if (step === "yard") setStep("layout");
  }

  function prevStep() {
    setError(null);
    setReplaceConfirmOpen(false);
    if (step === "layout") setStep("yard");
    else if (step === "yard") setStep("goals");
    else if (step === "goals") setStep("style");
  }

  function replaceConfirmMessage(): string | null {
    if (!hasExistingLayout) return null;
    const useExisting =
      spaceMode === "existing" && zones.length > 0 && selectedZoneId;
    const existingZone = useExisting
      ? zones.find((z) => z.id === selectedZoneId)
      : undefined;
    if (existingZone) {
      return `Fill “${existingZone.name}” with a new plant layout? Your zone shape stays the same; existing plants will be replaced.`;
    }
    return null;
  }

  function requestBuild() {
    setError(null);
    const useExisting =
      spaceMode === "existing" && zones.length > 0 && selectedZoneId;
    if (useExisting && hasExistingLayout && !replaceConfirmOpen) {
      setReplaceConfirmOpen(true);
      return;
    }
    void generate();
  }

  async function generate() {
    const useExisting =
      spaceMode === "existing" && zones.length > 0 && selectedZoneId;
    const existingZone = useExisting
      ? zones.find((z) => z.id === selectedZoneId)
      : undefined;

    if (useExisting && !existingZone) {
      setError("Pick a zone on the canvas to fill.");
      return;
    }

    let w = parseFeetInput(widthInput, 20);
    let h = parseFeetInput(heightInput, 20);
    if (existingZone) {
      const dims = zoneLayoutDimensions(existingZone);
      w = dims.widthFeet;
      h = dims.heightFeet;
    }

    const answers: AutoPopulateAnswers = {
      hardinessZone,
      preferences: wizardPreferences,
      widthFeet: w,
      heightFeet: h,
      existingZone,
    };

    setLoading(true);
    setReplaceConfirmOpen(false);
    setError(null);
    try {
      const { zone, placements, meta } = await runAutoPopulate(answers);
      applyAutoPopulate(placements, {
        zone,
        fillZoneId: existingZone?.id,
        replacePlantsInZone: Boolean(existingZone),
        mergeWithExisting: !existingZone && zones.length > 0,
      });
      if (meta.message && placements.length > 0) {
        console.info(
          `[auto-fill] ${meta.source}: ${placements.length} plants — ${meta.message}`,
        );
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="designer-wizard-overlay"
      role="presentation"
      onClick={() => !loading && onClose()}
    >
      <div
        className="designer-wizard-card designer-wizard-card--wide"
        role="dialog"
        aria-labelledby="auto-populate-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="designer-wizard-head">
          <div>
            <p className="designer-wizard-kicker">Quick start</p>
            <h2 id="auto-populate-title">Build my garden</h2>
            <p className="designer-wizard-lead">
              Answer a few questions about what you want — we&apos;ll pick plants
              and spacing that fit your goals, not a one-size-fits-all template.
            </p>
          </div>
          <button
            type="button"
            className="designer-wizard-close"
            aria-label="Close"
            disabled={loading}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="designer-wizard-progress" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`designer-wizard-progress-dot${i <= stepIndex ? " is-done" : ""}${s === step ? " is-current" : ""}`}
            />
          ))}
        </div>

        {step === "style" && (
          <section className="designer-wizard-step">
            <h3>What kind of garden?</h3>
            <p className="designer-wizard-hint">
              Pick your main vibe — we&apos;ll pre-fill the next steps, and you
              can fine-tune everything.
            </p>
            <div className="designer-wizard-style-grid">
              {GARDEN_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`designer-wizard-style-card${gardenStyle === opt.id ? " is-on" : ""}`}
                  onClick={() => selectGardenStyle(opt.id)}
                >
                  <span className="designer-wizard-style-title">{opt.title}</span>
                  <span className="designer-wizard-style-desc">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "goals" && (
          <section className="designer-wizard-step">
            <h3>What do you want from it?</h3>
            <p className="designer-wizard-recap">
              <strong>{GARDEN_STYLE_LABELS[gardenStyle]}</strong>
              {styleMeta ? ` — ${styleMeta.description}` : ""}
            </p>

            <fieldset className="designer-wizard-fieldset">
              <legend>
                How you&apos;ll use the garden{" "}
                <span className="designer-wizard-legend-hint">
                  (pick up to {MAX_USES})
                </span>
              </legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_USE_OPTIONS.map((opt) => {
                  const on = uses.includes(opt.id);
                  const full = !on && uses.length >= MAX_USES;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`designer-wizard-chip${on ? " is-on" : ""}${full ? " is-disabled" : ""}`}
                      disabled={full}
                      onClick={() =>
                        setUses((u) => toggleSelection(u, opt.id, MAX_USES))
                      }
                    >
                      <span className="designer-wizard-chip-label">{opt.label}</span>
                      <span className="designer-wizard-chip-hint">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="designer-wizard-fieldset">
              <legend>
                Plant focus{" "}
                <span className="designer-wizard-legend-hint">
                  (pick up to {MAX_PRIORITIES})
                </span>
              </legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_PRIORITY_OPTIONS.map((opt) => {
                  const on = priorities.includes(opt.id);
                  const full = !on && priorities.length >= MAX_PRIORITIES;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`designer-wizard-chip${on ? " is-on" : ""}${full ? " is-disabled" : ""}`}
                      disabled={full}
                      onClick={() =>
                        setPriorities((p) =>
                          toggleSelection(p, opt.id, MAX_PRIORITIES),
                        )
                      }
                    >
                      <span className="designer-wizard-chip-label">{opt.label}</span>
                      <span className="designer-wizard-chip-hint">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </section>
        )}

        {step === "yard" && (
          <section className="designer-wizard-step">
            <h3>Your yard & routine</h3>
            <p className="designer-wizard-hint">
              Honest answers here help us avoid fussy plants or the wrong sun
              match.
            </p>

            <fieldset className="designer-wizard-fieldset">
              <legend>Sun on this bed</legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_SUN_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`designer-wizard-chip${sun === opt.id ? " is-on" : ""}`}
                    onClick={() => setSun(opt.id)}
                  >
                    <span className="designer-wizard-chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="designer-wizard-fieldset">
              <legend>Watering</legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_WATER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`designer-wizard-chip${water === opt.id ? " is-on" : ""}`}
                    onClick={() => setWater(opt.id)}
                  >
                    <span className="designer-wizard-chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="designer-wizard-fieldset">
              <legend>Time you can spend</legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`designer-wizard-chip${time === opt.id ? " is-on" : ""}`}
                    onClick={() => setTime(opt.id)}
                  >
                    <span className="designer-wizard-chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="designer-wizard-fieldset">
              <legend>Growing experience</legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`designer-wizard-chip${experience === opt.id ? " is-on" : ""}`}
                    onClick={() => setExperience(opt.id)}
                  >
                    <span className="designer-wizard-chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="designer-wizard-fieldset">
              <legend>Who you&apos;re growing for</legend>
              <div className="designer-wizard-chips designer-wizard-chips--grid">
                {GARDEN_HOUSEHOLD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`designer-wizard-chip${household === opt.id ? " is-on" : ""}`}
                    onClick={() => setHousehold(opt.id)}
                  >
                    <span className="designer-wizard-chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>
        )}

        {step === "layout" && (
          <section className="designer-wizard-step">
            <h3>Bed size & density</h3>
            <p className="designer-wizard-hint">
              Last step — then we&apos;ll place a starter layout you can drag and
              edit.
            </p>

            <div className="designer-wizard-summary" aria-live="polite">
              <p className="designer-wizard-summary-label">Your plan</p>
              <p className="designer-wizard-summary-text">{profilePreview}</p>
            </div>

            <p className="designer-wizard-field-label">How densely planted?</p>
            <div className="designer-wizard-style-grid designer-wizard-density-grid">
              {PLANTING_DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`designer-wizard-style-card${plantingDensity === opt.id ? " is-on" : ""}`}
                  onClick={() => setPlantingDensity(opt.id)}
                >
                  <span className="designer-wizard-style-title">{opt.title}</span>
                  <span className="designer-wizard-style-desc">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>

            {zones.length > 0 && (
              <>
                <p className="designer-wizard-field-label">Bed on canvas</p>
                <div className="designer-wizard-space-mode">
                  <button
                    type="button"
                    className={`designer-wizard-preset${spaceMode === "existing" ? " is-on" : ""}`}
                    onClick={() => {
                      setReplaceConfirmOpen(false);
                      setSpaceMode("existing");
                    }}
                  >
                    Use my space
                  </button>
                  <button
                    type="button"
                    className={`designer-wizard-preset${spaceMode === "new" ? " is-on" : ""}`}
                    onClick={() => {
                      setReplaceConfirmOpen(false);
                      setSpaceMode("new");
                    }}
                  >
                    New bed size
                  </button>
                </div>

                {spaceMode === "existing" && (
                  <ul className="designer-wizard-zone-pick">
                    {zones.map((z) => (
                      <li key={z.id}>
                        <button
                          type="button"
                          className={`designer-wizard-zone-pick-btn${selectedZoneId === z.id ? " is-on" : ""}`}
                          onClick={() => setSelectedZoneId(z.id)}
                        >
                          <strong>{z.name}</strong>
                          <span>{zoneSummary(z)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {(spaceMode === "new" || zones.length === 0) && (
              <>
                <p className="designer-wizard-field-label">New bed size</p>
                <div className="designer-wizard-presets">
                  {SPACE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`designer-wizard-preset${presetId === p.id && !customSize ? " is-on" : ""}`}
                      onClick={() => selectPreset(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`designer-wizard-preset${customSize ? " is-on" : ""}`}
                    onClick={() => selectPreset("custom")}
                  >
                    Custom size
                  </button>
                </div>
                {customSize && (
                  <div
                    className="designer-wizard-dimensions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="designer-wizard-field">
                      <span>Width (feet)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={widthInput}
                        onChange={(e) => setWidthInput(e.target.value)}
                        onBlur={() => {
                          setWidthInput(String(parseFeetInput(widthInput, 20)));
                        }}
                      />
                    </label>
                    <label className="designer-wizard-field">
                      <span>Length (feet)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        onBlur={() => {
                          setHeightInput(String(parseFeetInput(heightInput, 20)));
                        }}
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            <p className="designer-wizard-field-label">Where in Florida?</p>
            <div className="designer-wizard-climate-grid">
              {CLIMATE_REGION_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`designer-wizard-climate-card${hardinessZone === r.value ? " is-on" : ""}`}
                  onClick={() => setHardinessZone(r.value)}
                >
                  <span className="designer-wizard-climate-label">{r.label}</span>
                  <span className="designer-wizard-climate-hint">{r.hint}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <p className="designer-wizard-error">{error}</p>}

        {step === "layout" && replaceConfirmOpen && replaceConfirmMessage() && (
          <div
            className="designer-wizard-confirm"
            role="alertdialog"
            aria-labelledby="auto-populate-confirm-title"
            aria-describedby="auto-populate-confirm-desc"
          >
            <p id="auto-populate-confirm-title" className="designer-wizard-confirm-title">
              Replace current layout?
            </p>
            <p id="auto-populate-confirm-desc" className="designer-wizard-confirm-desc">
              {replaceConfirmMessage()}
            </p>
          </div>
        )}

        <footer className="designer-wizard-foot">
          {stepIndex > 0 ? (
            <button
              type="button"
              className="designer-wizard-btn designer-wizard-btn--ghost"
              disabled={loading}
              onClick={prevStep}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step !== "layout" ? (
            <button
              type="button"
              className="designer-wizard-btn designer-wizard-btn--primary"
              onClick={nextStep}
            >
              Next
            </button>
          ) : replaceConfirmOpen ? (
            <div className="designer-wizard-foot-actions">
              <button
                type="button"
                className="designer-wizard-btn designer-wizard-btn--ghost"
                disabled={loading}
                onClick={() => setReplaceConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="designer-wizard-btn designer-wizard-btn--primary"
                disabled={loading}
                onClick={() => void generate()}
              >
                {loading ? "Placing plants…" : "Yes, replace layout"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="designer-wizard-btn designer-wizard-btn--primary"
              disabled={loading}
              onClick={requestBuild}
            >
              {loading ? "Placing plants…" : "Build my garden"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
