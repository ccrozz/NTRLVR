import { EVERGREEN_SOLUTIONS_URL } from "../lib/evergreen-partner";

export function EvergreenHeaderLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={EVERGREEN_SOLUTIONS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`designer-header-evergreen${className ? ` ${className}` : ""}`}
    >
      Pro install
      <span className="designer-header-evergreen-icon" aria-hidden>
        ↗
      </span>
    </a>
  );
}
