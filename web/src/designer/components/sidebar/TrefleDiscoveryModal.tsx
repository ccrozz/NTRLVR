import { useState, useEffect } from "react";
import { usePlants } from "../../hooks/usePlants";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { PlantListItem } from "../../types";

const API = import.meta.env.VITE_API_URL ?? "";

export function TrefleDiscoveryModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const addPlant = useDesignerStore((s) => s.addPlant);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = usePlants(debounced, null, {
    trefleLive: true,
    enabled: debounced.length > 1,
  });
  const results = data?.pages.flatMap((p) => p.items) ?? [];

  async function addFromTrefle(item: PlantListItem) {
    let plant = item;
    if (item.trefle_id) {
      try {
        const res = await fetch(`${API}/api/plants/${item.trefle_id}`);
        if (res.ok) {
          const json = await res.json();
          plant = { ...item, ...json.data, source: "trefle" };
        }
      } catch {
        /* use summary */
      }
    }
    addPlant(plant, 200 + Math.random() * 200, 200 + Math.random() * 200);
    onClose();
  }

  return (
    <div className="designer-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="designer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="trefle-modal-title"
      >
        <header className="designer-modal-header">
          <h2 id="trefle-modal-title">Discover via Trefle</h2>
          <button type="button" className="rr-btn rr-btn-secondary" onClick={onClose}>
            Close
          </button>
        </header>
        <div style={{ padding: "0 1rem" }}>
          <input
            className="designer-search"
            type="search"
            placeholder="Search Trefle database…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <div className="designer-modal-body">
          {isLoading && <p className="designer-section-label">Searching…</p>}
          {results.map((plant) => (
            <div
              key={plant.id}
              className="designer-plant-card"
              style={{ cursor: "default", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div className="designer-card-body" style={{ flex: 1 }}>
                <h3>{plant.common_name}</h3>
                <p className="sci">{plant.scientific_name}</p>
              </div>
              <button
                type="button"
                className="rr-btn rr-btn-primary"
                style={{ flexShrink: 0, padding: "0.4rem 0.65rem", fontSize: "0.75rem" }}
                onClick={() => addFromTrefle(plant)}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
