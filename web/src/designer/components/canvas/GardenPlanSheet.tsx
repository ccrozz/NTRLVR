import { EvergreenInstallCta } from "../../../components/EvergreenInstallCta";
import { focusDesignerCanvas } from "../../lib/focus-designer-canvas";
import { useDesignerStore } from "../../store/useDesignerStore";

export function GardenPlanSheet() {
  const open = useDesignerStore((s) => s.planSheetOpen);
  const profile = useDesignerStore((s) => s.gardenProfile);
  const zones = useDesignerStore((s) => s.zones);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const gardenPlanPlacedOnCanvas = useDesignerStore(
    (s) => s.gardenPlanPlacedOnCanvas,
  );
  const setPlanSheetOpen = useDesignerStore((s) => s.setPlanSheetOpen);
  const placeRecommendedOnCanvas = useDesignerStore(
    (s) => s.placeRecommendedOnCanvas,
  );
  const placingGardenOnCanvas = useDesignerStore((s) => s.placingGardenOnCanvas);

  const hasOtherBeds = zones.length > 0 || canvasPlants.length > 0;

  function closeToCanvas() {
    setPlanSheetOpen(false);
    focusDesignerCanvas();
  }

  if (!open || !profile) return null;

  return (
    <>
      <button
        type="button"
        className="garden-plan-sheet-backdrop"
        aria-label="Close plan"
        onClick={() => setPlanSheetOpen(false)}
      />
      <div
        className="garden-plan-sheet"
        role="dialog"
        aria-labelledby="garden-plan-sheet-title"
      >
        <button
          type="button"
          className="garden-plan-sheet-handle"
          aria-label="Close plan"
          onClick={() => setPlanSheetOpen(false)}
        />
        <div className="garden-plan-sheet-scroll">
          <p className="garden-plan-sheet-kicker">Your garden plan</p>
          <h2 id="garden-plan-sheet-title" className="garden-plan-sheet-title">
            {profile.name}
          </h2>
          <p className="garden-plan-sheet-desc">{profile.description}</p>
          <blockquote className="garden-plan-sheet-quote">
            {profile.philosophy}
          </blockquote>

          <section className="garden-plan-sheet-section">
            <h3>Planting sequence</h3>
            <ol className="garden-plan-sheet-list">
              {profile.planting_sequence.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="garden-plan-sheet-section">
            <h3>First year focus</h3>
            <p>{profile.first_year_focus}</p>
          </section>

          <section className="garden-plan-sheet-section">
            <h3>Avoid these mistakes</h3>
            <ul className="garden-plan-sheet-list">
              {profile.avoid_mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="garden-plan-sheet-actions">
          {gardenPlanPlacedOnCanvas ? (
            <>
              <p className="garden-plan-sheet-place-hint">
                This plan is already on your canvas.
              </p>
              <button
                type="button"
                className="garden-plan-sheet-place"
                onClick={closeToCanvas}
              >
                Done — view on canvas
              </button>
            </>
          ) : (
            <>
              {hasOtherBeds && (
                <p className="garden-plan-sheet-place-hint">
                  Adds a new bed beside your existing layout — other spaces stay
                  as they are.
                </p>
              )}
              <button
                type="button"
                className="garden-plan-sheet-place"
                disabled={placingGardenOnCanvas}
                onClick={() => void placeRecommendedOnCanvas()}
              >
                {placingGardenOnCanvas
                  ? "Placing on canvas…"
                  : "Add plants to canvas →"}
              </button>
            </>
          )}
          <EvergreenInstallCta compact className="garden-plan-sheet-evergreen" />
        </div>
      </div>
    </>
  );
}
