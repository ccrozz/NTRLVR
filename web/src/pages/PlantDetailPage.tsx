import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPlant } from "../api";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlantPlaceholderIcon,
  SproutIcon,
} from "../components/Icons";
import { effectiveNativeStates } from "@lib/plant-native-status";
import { sanitizeNativeOriginLabel } from "@lib/native-origin";
import { BenefitsGroups } from "../components/BenefitsGroups";
import { CatalogPlantGuideSection } from "../components/CatalogPlantGuide";
import { buildCatalogPlantGuide } from "../lib/catalog-plant-guide";
import { useCatalogGrowingContext } from "../lib/catalog-state";
import "../styles/catalog.css";
import type { Plant } from "../types";

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function MetaGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="detail-meta">
      {items.map(({ label, value }) => (
        <div key={label} className="meta-item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ListOrEmpty({
  items,
  empty = "—",
}: {
  items: string[];
  empty?: string;
}) {
  if (!items.length) return <p className="detail-empty">{empty}</p>;
  return (
    <ul className="detail-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) return <p className="detail-empty">—</p>;
  return (
    <div className="tag-list">
      {items.map((t) => (
        <span key={t} className="tag">
          {t}
        </span>
      ))}
    </div>
  );
}

function RelationList({ items }: { items: string[] }) {
  if (!items.length) return <p className="detail-empty">—</p>;
  return (
    <ul className="detail-list detail-companions">
      {items.map((item) => {
        const isDbId =
          item.startsWith("trefle-") ||
          (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(item) && !item.includes(" "));
        return (
          <li key={item}>
            {isDbId && !item.includes(" ") ? (
              <Link to={`/plants/${item}`}>
                {item.replace(/^trefle-/, "")}
              </Link>
            ) : (
              item
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <article className="detail-page detail-loading-skeleton">
      <div className="detail-skeleton-hero">
        <div className="detail-skeleton-image" />
        <div>
          <div className="skeleton-line" style={{ height: "2rem", width: "70%" }} />
          <div
            className="skeleton-line"
            style={{ marginTop: "0.75rem", width: "50%" }}
          />
          <div
            className="skeleton-line"
            style={{ marginTop: "1.5rem", width: "80%" }}
          />
        </div>
      </div>
      <div className="skeleton-line" style={{ height: "8rem", margin: "0 0 1rem" }} />
      <div className="skeleton-line" style={{ height: "6rem", margin: "0" }} />
    </article>
  );
}

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const growingCtx = useCatalogGrowingContext();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSources([]);
    fetchPlant(id)
      .then(({ data, meta }) => {
        setPlant(data);
        setSources(meta?.sources ?? []);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load plant"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="detail-loading">
        <span className="spinner" aria-hidden />
        <p>Loading plant… may enrich from Trefle &amp; Wikipedia</p>
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !plant) {
    return (
      <section className="error-state detail-page">
        <SproutIcon />
        <h3>{error ?? "Plant not found"}</h3>
        <Link to="/catalog" className="btn btn-primary">
          Back to catalog
        </Link>
      </section>
    );
  }

  const zoneList = plant.florida_hardiness_zones ?? plant.growing_zones ?? [];
  const zones = zoneList.length > 0 ? zoneList.join(", ") : "—";
  const growingGuide = buildCatalogPlantGuide(plant, growingCtx);
  const nativeOriginLabel = sanitizeNativeOriginLabel(plant.native_origin);

  return (
    <article className="detail-page">
      <Link to="/catalog" className="detail-back" title="Plant catalog">
        <ArrowLeftIcon />
        Back to catalog
      </Link>

      {sources.length > 0 && (
        <p className="detail-notice detail-notice-success">
          <CheckCircleIcon />
          Enriched from {sources.join(" · ")} and saved locally.
        </p>
      )}

      <header className="detail-hero">
        <figure className="detail-image">
          {plant.image_url ? (
            <img src={plant.image_url} alt={plant.common_name} />
          ) : (
            <span className="plant-card-placeholder">
              <PlantPlaceholderIcon />
              No image available
            </span>
          )}
        </figure>

        <section className="detail-intro">
          <h1>{plant.common_name}</h1>
          <p className="scientific">{plant.scientific_name}</p>

          <div className="badges">
            <span className="badge">{plant.category}</span>
            <span className="badge">{plant.canopy_layer}</span>
            {zoneList.map((z) => (
              <span key={z} className="badge badge-zone">
                {z}
              </span>
            ))}
            {plant.is_edible && (
              <span className="badge badge-accent">Edible</span>
            )}
            {plant.is_kitchen_essential && (
              <span className="badge badge-accent">Kitchen essential</span>
            )}
            {!nativeOriginLabel &&
              effectiveNativeStates(plant).length > 0 && (
              <span className="badge badge-accent">
                Native: {effectiveNativeStates(plant).join(", ")}
              </span>
            )}
            {plant.is_invasive_in_florida && (
              <span className="badge badge-warn">Invasive in FL</span>
            )}
          </div>
          {nativeOriginLabel && (
            <p className="detail-native-origin">{nativeOriginLabel}</p>
          )}
        </section>
      </header>

      <div className="detail-sections">
        <CatalogPlantGuideSection guide={growingGuide} />

        <DetailSection title="Growing conditions">
          <MetaGrid
            items={[
              { label: "Sunlight", value: plant.sunlight },
              { label: "Water", value: plant.water_needs },
              { label: "Growth rate", value: plant.growth_rate },
              { label: "Growing zones", value: zones },
              {
                label: "Best planting seasons",
                value:
                  plant.best_planting_seasons.length > 0
                    ? plant.best_planting_seasons.join(", ")
                    : "—",
              },
              {
                label: "Soil preferences",
                value:
                  plant.soil_preferences.length > 0
                    ? plant.soil_preferences.join(", ")
                    : "—",
              },
            ]}
          />
        </DetailSection>

        <DetailSection title="Size & spacing">
          <MetaGrid
            items={[
              {
                label: "Mature height",
                value: `${plant.mature_height_feet[0]}–${plant.mature_height_feet[1]} ft`,
              },
              {
                label: "Mature spread",
                value: `${plant.mature_spread_feet[0]}–${plant.mature_spread_feet[1]} ft`,
              },
              {
                label: "Canvas radius",
                value: `${plant.canvas_radius_feet} ft`,
              },
            ]}
          />
        </DetailSection>

        <DetailSection title="Uses">
          <ListOrEmpty items={plant.uses} empty="No uses listed." />
        </DetailSection>

        <DetailSection title="Benefits">
          <BenefitsGroups benefits={plant.benefits} />
        </DetailSection>

        <DetailSection title="Guild roles">
          <TagList items={plant.guild_functions} />
        </DetailSection>

        <DetailSection title="Companion plants">
          <RelationList items={plant.companion_plants} />
          {!plant.companion_plants.length && (
            <p className="detail-hint">
              Companion data is sparse for many species. Wikipedia cultivation
              sections are searched when you open a plant.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Avoid planting near">
          <RelationList items={plant.avoid_planting_near} />
        </DetailSection>
      </div>
    </article>
  );
}
