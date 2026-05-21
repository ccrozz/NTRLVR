import { Link, useLocation } from "react-router-dom";
import { DESIGNER_STATES } from "@lib/designer-states";
import { useDesignerStore } from "../store/useDesignerStore";

export function DesignerStateSwitcher({ compact = false }: { compact?: boolean }) {
  const designerState = useDesignerStore((s) => s.designerState);
  const setDesignerState = useDesignerStore((s) => s.setDesignerState);
  const location = useLocation();
  const uploadSuffix = location.search.includes("mode=upload")
    ? "?mode=upload"
    : "";

  return (
    <nav
      className={`designer-state-switcher${compact ? " designer-state-switcher--compact" : ""}`}
      aria-label="Choose your state"
    >
      {!compact && (
        <span className="designer-state-switcher-label">Design for</span>
      )}
      <div className="designer-state-switcher-chips" role="group">
        {DESIGNER_STATES.map((st) => (
          <button
            key={st.code}
            type="button"
            className={`designer-state-chip${designerState === st.code ? " is-active" : ""}`}
            aria-pressed={designerState === st.code}
            title={st.tagline}
            onClick={() => setDesignerState(st.code)}
          >
            {st.shortName}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="designer-state-switcher-hint">
          Plants, zones, and Build For Me are tailored to your state.{" "}
          <Link to={`/catalog${uploadSuffix}`}>Browse all states</Link>
        </p>
      )}
    </nav>
  );
}
