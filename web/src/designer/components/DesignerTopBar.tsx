import { Link } from "react-router-dom";
import { AppNav } from "../../components/AppNav";

export function DesignerTopBar({
  helpOpen,
  onHelpClick,
  onAutoPopulateClick,
}: {
  helpOpen: boolean;
  onHelpClick: () => void;
  onAutoPopulateClick: () => void;
}) {
  return (
    <header className="designer-top-bar">
      <Link to="/" className="designer-top-brand" title="NTR LVR home">
        NTR LVR
      </Link>
      <AppNav variant="dark" />
      <div className="designer-top-bar-end">
        <button
          type="button"
          className="designer-top-autofill"
          onClick={onAutoPopulateClick}
          title="Pick a garden type and auto-build a starter layout"
        >
          Auto-fill
        </button>
        <button
          type="button"
          className={`designer-top-help${helpOpen ? " is-active" : ""}`}
          onClick={onHelpClick}
          aria-expanded={helpOpen}
          aria-label={helpOpen ? "Hide instructions" : "Show how to use the designer"}
          title="How to use the designer"
        >
          ?
        </button>
      </div>
    </header>
  );
}
