import { useDesignerStore } from "../../store/useDesignerStore";

export function RecommendationHeader() {
  const profile = useDesignerStore((s) => s.gardenProfile);
  const gardenPlanPlacedOnCanvas = useDesignerStore(
    (s) => s.gardenPlanPlacedOnCanvas,
  );
  const setPlanSheetOpen = useDesignerStore((s) => s.setPlanSheetOpen);
  const resetBuildForMe = useDesignerStore((s) => s.resetBuildForMe);

  if (!profile) return null;

  return (
    <div className="recommendation-header">
      <p className="recommendation-header-kicker">
        Your garden
        {gardenPlanPlacedOnCanvas && (
          <span className="recommendation-header-badge">On canvas</span>
        )}
      </p>
      <h2 className="recommendation-header-title">&ldquo;{profile.name}&rdquo;</h2>
      <div className="recommendation-header-actions">
        <button
          type="button"
          className="recommendation-header-btn recommendation-header-btn--primary"
          onClick={() => setPlanSheetOpen(true)}
        >
          View full plan
        </button>
        <button
          type="button"
          className="recommendation-header-btn"
          onClick={() => resetBuildForMe()}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
