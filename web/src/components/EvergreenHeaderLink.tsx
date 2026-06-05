import { EVERGREEN_SOLUTIONS_URL } from "../lib/evergreen-partner";

export function EvergreenHeaderLink({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <a
      href={EVERGREEN_SOLUTIONS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`designer-header-evergreen${compact ? " designer-header-evergreen--compact" : ""}${className ? ` ${className}` : ""}`}
    >
      Pro install
      <span className="designer-header-evergreen-icon" aria-hidden>
        ↗
      </span>
    </a>
  );
}
