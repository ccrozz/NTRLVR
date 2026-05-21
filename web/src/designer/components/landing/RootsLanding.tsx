import { useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DESIGNER_STATES } from "@lib/designer-states";
import { AppNav } from "../../../components/AppNav";

/** Bundled in web/public/images/landing/ */
const STATE_VISUALS: Record<
  string,
  { image: string; zones: string; objectPosition: string; overlayClass: string }
> = {
  FL: {
    image: "/images/landing/fl.jpg",
    objectPosition: "center 45%",
    overlayClass: "rr-state-overlay--fl",
    zones: "Zones 8b–11",
  },
  TN: {
    image: "/images/landing/tn.jpg",
    objectPosition: "center 40%",
    overlayClass: "rr-state-overlay--tn",
    zones: "Zones 6a–8a",
  },
  CT: {
    image: "/images/landing/ct.jpg",
    objectPosition: "center 50%",
    overlayClass: "rr-state-overlay--ct",
    zones: "Zones 5b–7a",
  },
};

/** Full-page loop — Pexels (Mikhail Nilov), free license */
const LANDING_VIDEO_SRC = "/videos/landing-bg-nature.mp4";
const LANDING_VIDEO_POSTER = "/images/landing/tn.jpg";
/** Slower than 1× for a calmer background (muted video — no pitch issue) */
const LANDING_VIDEO_PLAYBACK_RATE = 0.6;

const STEPS = [
  { num: "01", title: "Pick your state", body: "Florida, Tennessee, or Connecticut catalogs." },
  { num: "02", title: "Set your zone", body: "ZIP lookup or regional shortcuts in the designer." },
  { num: "03", title: "Place & refine", body: "Drag plants, tune layers, export your food forest plan." },
] as const;

export function RootsLanding() {
  const [params] = useSearchParams();
  const upload = params.get("mode") === "upload";
  const uploadQuery = upload ? "?mode=upload" : "";
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const applyVideoPlaybackRate = useCallback(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    video.playbackRate = reducedMotion ? 1 : LANDING_VIDEO_PLAYBACK_RATE;
  }, []);

  useEffect(() => {
    applyVideoPlaybackRate();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", applyVideoPlaybackRate);
    return () => mq.removeEventListener("change", applyVideoPlaybackRate);
  }, [applyVideoPlaybackRate]);

  return (
    <div className="designer-root rr-landing">
      <div className="rr-landing-bg" aria-hidden>
        <video
          ref={bgVideoRef}
          className="rr-landing-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={LANDING_VIDEO_POSTER}
          onLoadedMetadata={applyVideoPlaybackRate}
        >
          <source src={LANDING_VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="rr-landing-bg-scrim" />
      </div>

      <header className="designer-top-bar rr-landing-top">
        <Link to="/" className="designer-top-brand">
          NTR LVR
        </Link>
        <AppNav variant="dark" />
        <div className="designer-top-bar-end" aria-hidden />
      </header>

      <main className="rr-landing-main">
        <header className="rr-landing-intro">
          <h1>Design your dream space</h1>
          <p className="rr-landing-tagline">One plant at a time.</p>
        </header>

        <section className="rr-landing-states" aria-labelledby="states-heading">
          <div className="rr-landing-states-head">
            <h2 id="states-heading">Where are you growing?</h2>
            <p className="rr-landing-states-lead">
              Choose a state to open the designer with a curated regional catalog.
            </p>
          </div>
          <div className="rr-state-grid">
            {DESIGNER_STATES.map((st) => {
              const visual = STATE_VISUALS[st.code];
              return (
                <Link
                  key={st.code}
                  to={`/designer?state=${st.code}${upload ? "&mode=upload" : ""}`}
                  className="rr-state-card"
                  aria-label={`${st.name} — ${st.tagline}`}
                >
                  {visual && (
                    <div className="rr-state-card-media">
                      <img
                        src={visual.image}
                        alt=""
                        loading="eager"
                        decoding="async"
                        style={{ objectPosition: visual.objectPosition }}
                      />
                      <div
                        className={`rr-state-card-overlay ${visual.overlayClass}`}
                        aria-hidden
                      />
                      <span className="rr-state-code">{st.code}</span>
                    </div>
                  )}
                  <div className="rr-state-card-foot">
                    <span className="rr-state-card-body">
                      <strong>{st.name}</strong>
                      <span>{st.tagline}</span>
                    </span>
                    {visual && (
                      <span className="rr-state-zone">{visual.zones}</span>
                    )}
                    <span className="rr-state-arrow" aria-hidden>
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="rr-cta-row">
            <Link
              to={`/designer?state=FL${uploadQuery ? uploadQuery.replace("?", "&") : ""}`}
              className="rr-btn rr-btn-primary"
            >
              Open designer
            </Link>
            <Link to="/catalog" className="rr-btn rr-btn-secondary">
              Browse full catalog
            </Link>
          </div>
          {upload && (
            <p className="rr-landing-upload-note">
              Yard photo mode — we&apos;ll open the designer ready for your image.
            </p>
          )}
        </section>

        <section className="rr-landing-how" aria-labelledby="how-heading">
          <div className="rr-landing-how-head">
            <h2 id="how-heading">How it works</h2>
            <p>From blank lot to a climate-aware plant list in minutes.</p>
          </div>
          <ol className="rr-landing-steps">
            {STEPS.map((step) => (
              <li key={step.num} className="rr-landing-step">
                <span className="rr-landing-step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="rr-landing-footer">
        <p className="rr-landing-footer-note">
          Natives, edibles, and guild roles — filtered by state and zone.
        </p>
        <p className="rr-landing-powered">
          Powered by{" "}
          <a
            href="https://www.evergreensolutionsfl.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Evergreen Solutions FL
          </a>
        </p>
      </footer>
    </div>
  );
}
