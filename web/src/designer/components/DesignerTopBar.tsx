import { Link } from "react-router-dom";
import { AppNav } from "../../components/AppNav";
import { EvergreenHeaderLink } from "../../components/EvergreenHeaderLink";
import { useMatchMedia } from "../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../lib/mobile-layout";
import { DesignerMobileTopNav } from "./DesignerMobileTopNav";

export function DesignerTopBar({
  helpOpen,
  onHelpClick,
  onAutoPopulateClick,
}: {
  helpOpen: boolean;
  onHelpClick: () => void;
  onAutoPopulateClick: () => void;
}) {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);

  return (
    <header className="designer-top-bar">
      <Link to="/" className="designer-top-brand" title="NTR LVR home">
        NTR LVR
      </Link>
      {isMobile ? <DesignerMobileTopNav /> : <AppNav variant="dark" />}
      <div className="designer-top-bar-end">
        <EvergreenHeaderLink compact={isMobile} />
        <button
          type="button"
          className="designer-top-autofill"
          onClick={onAutoPopulateClick}
          title="Answer a few questions and we'll build a personalized layout"
        >
          Let&apos;s build your garden
        </button>
        <button
          type="button"
          className={`designer-top-help${helpOpen ? " is-active" : ""}`}
          onClick={onHelpClick}
          aria-expanded={helpOpen}
          aria-label={helpOpen ? "Hide instructions" : "Show how to use the designer"}
          title="How to use the designer"
        >
          <svg
            className="designer-top-help-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path
              d="M9.5 9.25a2.5 2.5 0 0 1 4.6 1.15c0 1.35-1.35 1.6-2.1 2.05-.55.35-.75.7-.75 1.3v.25"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.75" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
