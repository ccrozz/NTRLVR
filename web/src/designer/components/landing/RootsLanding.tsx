import { Link, useSearchParams } from "react-router-dom";
import { AppNav } from "../../../components/AppNav";

export function RootsLanding() {
  const [params] = useSearchParams();
  const upload = params.get("mode") === "upload";

  return (
    <div className="designer-root rr-landing">
      <header className="designer-top-bar rr-landing-top">
        <Link to="/" className="designer-top-brand">
          NTR LVR
        </Link>
        <AppNav variant="dark" />
        <div className="designer-top-bar-end" aria-hidden />
      </header>
      <div className="rr-landing-bg" aria-hidden>
        <span className="rr-leaf rr-leaf-1" />
        <span className="rr-leaf rr-leaf-2" />
        <span className="rr-leaf rr-leaf-3" />
      </div>
      <div className="rr-landing-content">
        <h1>NTR LVR</h1>
        <p className="rr-landing-tagline">
          Design your Florida food forest — one plant at a time.
        </p>
        <div className="rr-cta-row">
          <Link to="/designer" className="rr-btn rr-btn-primary">
            Start with a blank canvas
          </Link>
          <Link
            to="/designer?mode=upload"
            className="rr-btn rr-btn-secondary"
          >
            Upload a photo of my yard
          </Link>
        </div>
        {upload && (
          <p className="rr-landing-tagline" style={{ marginTop: "1.5rem" }}>
            You chose yard photo mode — we&apos;ll open the designer ready for
            your image.
          </p>
        )}
      </div>
      <div className="rr-landing-footer">
        <Link to="/catalog" className="rr-btn rr-btn-secondary">
          Browse the full plant catalog
        </Link>
        <p className="rr-landing-footer-note">
          USDA zones, natives, guilds — filter by your state and zone.
        </p>
      </div>
    </div>
  );
}
