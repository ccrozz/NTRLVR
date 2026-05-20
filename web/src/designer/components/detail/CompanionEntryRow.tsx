import type { Plant } from "../../../types";
import { useResolvePlantEntry } from "../../hooks/useResolvePlantEntry";
import { CompanionCard } from "./CompanionCard";
import { AvoidCard } from "./AvoidCard";

export function CompanionEntryRow({
  entry,
  host,
  hostCanvasId,
  variant,
}: {
  entry: string;
  host: Plant;
  hostCanvasId: string | null;
  variant: "companion" | "avoid";
}) {
  const { data: plant, isLoading } = useResolvePlantEntry(entry);

  if (isLoading) {
    return (
      <div className="detail-companion-card detail-companion-card--loading">
        <p className="detail-skeleton detail-skeleton--title" />
        <p className="detail-skeleton detail-skeleton--text" />
        <p className="detail-asking">Looking up {entry}…</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="detail-companion-card detail-companion-card--missing">
        <strong>{entry}</strong>
        <p className="detail-muted">
          Not in the food-forest catalog yet — add it manually from search.
        </p>
      </div>
    );
  }

  if (variant === "avoid") {
    return <AvoidCard host={host} other={plant} />;
  }

  return (
    <CompanionCard host={host} companion={plant} hostCanvasId={hostCanvasId} />
  );
}
