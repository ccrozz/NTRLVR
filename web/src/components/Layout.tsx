import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHealth } from "../api";
import { AppNav } from "./AppNav";

export function Layout() {
  const [plantCount, setPlantCount] = useState<number | null>(null);

  useEffect(() => {
    document.body.classList.add("rr-theme");
    return () => document.body.classList.remove("rr-theme");
  }, []);

  useEffect(() => {
    fetchHealth()
      .then((h) => setPlantCount(h.plant_count))
      .catch(() => setPlantCount(null));
  }, []);

  return (
    <div className="rr-app-shell">
      <header className="designer-top-bar">
        <Link to="/" className="designer-top-brand" title="NTR LVR home">
          NTR LVR
        </Link>
        <AppNav variant="dark" />
        <div className="designer-top-bar-end">
          {plantCount !== null && (
            <span className="rr-stat-pill">
              {plantCount.toLocaleString()} species
            </span>
          )}
        </div>
      </header>
      <div className="rr-app-main">
        <div className="rr-app-main-inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
