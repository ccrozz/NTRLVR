import {
  USDA_ZONE_LOOKUP_URL,
  hasZoneRegions,
  zoneRegionsForState,
  zoneSelectLabel,
} from "../zone-help";

export function ZoneHelp({
  stateCode,
  stateName,
  zoneRange,
  primaryZone,
  zones,
  selectedZone,
  onSelectZone,
}: {
  stateCode: string;
  stateName: string;
  zoneRange: string;
  primaryZone: string;
  zones: string[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}) {
  const regions = zoneRegionsForState(stateCode);
  const showRegions = hasZoneRegions(stateCode);

  return (
    <div className="zone-help">
      <p className="zone-help-lead">
        <strong>Not sure?</strong> You can browse all of {stateName} without
        picking a zone, or use one of these shortcuts:
      </p>

      <div className="zone-help-actions">
        <a
          href={USDA_ZONE_LOOKUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-zone-lookup"
        >
          Look up my zone by ZIP code
        </a>
        {primaryZone && (
          <button
            type="button"
            className="btn btn-ghost btn-zone-suggest"
            onClick={() => onSelectZone(primaryZone)}
          >
            Use typical zone for {stateName} ({primaryZone})
          </button>
        )}
      </div>

      {showRegions && (
        <div className="zone-regions">
          <p className="zone-regions-label">Or pick a rough part of {stateName}:</p>
          <div className="zone-region-chips" role="group" aria-label="Regional zone shortcuts">
            {regions.map((r) => (
              <button
                key={r.label}
                type="button"
                className={`zone-region-chip${selectedZone === r.zone ? " active" : ""}`}
                onClick={() => onSelectZone(r.zone)}
                title={`Sets zone ${r.zone} — ${r.hint}`}
              >
                <span className="zone-region-chip-label">{r.label}</span>
                <span className="zone-region-chip-meta">
                  ~{r.zone} · {r.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <details className="zone-details">
        <summary>What is a growing zone?</summary>
        <p>
          The USDA plant hardiness zone is based on your <em>average coldest</em>{" "}
          winter night. A lower number means colder winters. {stateName} ranges
          from <strong>{zoneRange}</strong> — colder in the north or mountains,
          warmer on the coast or south.
        </p>
        <p>
          If you&apos;re still unsure, leave &ldquo;I&apos;m not sure&rdquo; selected
          or use the ZIP lookup above, then choose the matching zone from the
          list.
        </p>
      </details>

      <label className="field zone-exact-field">
        <span>I know my exact zone</span>
        <select
          value={selectedZone}
          onChange={(e) => onSelectZone(e.target.value)}
        >
          <option value="">
            I&apos;m not sure — show all plants for {stateName}
          </option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zoneSelectLabel(zone, stateCode)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
