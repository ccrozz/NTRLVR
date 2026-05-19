import { CANOPY_COLORS } from "../../lib/canopy-colors";

export function CanopyLegend() {
  return (
    <div className="designer-legend">
      {Object.entries(CANOPY_COLORS).map(([layer, c]) => (
        <span key={layer}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: c.stroke,
            }}
          />
          {c.label}
        </span>
      ))}
    </div>
  );
}
