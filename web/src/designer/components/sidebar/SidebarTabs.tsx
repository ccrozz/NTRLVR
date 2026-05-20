import { useDesignerStore } from "../../store/useDesignerStore";

export function SidebarTabs() {
  const mode = useDesignerStore((s) => s.sidebarMode);
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);
  const resetBuildForMe = useDesignerStore((s) => s.resetBuildForMe);
  const pendingGardenPlan = useDesignerStore((s) => s.pendingGardenPlan);
  const gardenProfile = useDesignerStore((s) => s.gardenProfile);
  const questionnaireDraft = useDesignerStore((s) => s.questionnaireDraft);
  const hasDraftProgress = (questionnaireDraft?.qIndex ?? 0) > 0;
  const hasBuildPlan = Boolean(pendingGardenPlan || gardenProfile);

  return (
    <div className="sidebar-tabs-bar">
      <div className="sidebar-tabs" role="tablist" aria-label="Sidebar mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "browse"}
          className={`sidebar-tabs-btn${mode === "browse" ? " is-active" : ""}`}
          onClick={() => setSidebarMode("browse")}
        >
          Browse Plants
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "build"}
          className={`sidebar-tabs-btn${mode === "build" ? " is-active" : ""}`}
          onClick={() => setSidebarMode("build")}
        >
          Build For Me
        </button>
      </div>
      {mode === "build" && (hasDraftProgress || hasBuildPlan) && (
        <button
          type="button"
          className="sidebar-build-reset"
          onClick={() => resetBuildForMe()}
          title="Clear answers and recommendations, start a new questionnaire"
        >
          Start over
        </button>
      )}
      {mode === "build" && hasDraftProgress && (
        <p className="sidebar-build-reset-hint">Answers saved until you start over</p>
      )}
    </div>
  );
}
