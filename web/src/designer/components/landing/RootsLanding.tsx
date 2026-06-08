import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DESIGNER_STATES } from "@lib/designer-states";
import { AppNav } from "../../../components/AppNav";
import { EvergreenHeaderLink } from "../../../components/EvergreenHeaderLink";
import { EvergreenInstallCta } from "../../../components/EvergreenInstallCta";
import { EVERGREEN_SOLUTIONS_URL } from "../../../lib/evergreen-partner";
import { MOBILE_LAYOUT_QUERY, useMatchMedia } from "../../hooks/useMatchMedia";

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
  { num: "01", title: "Pick your state", body: "Florida, Tennessee, or Connecticut — each opens a curated designer catalog." },
  { num: "02", title: "Build or browse", body: "Answer Build For Me questions, or search and filter plants by layer and category." },
  { num: "03", title: "Place & refine", body: "Drag onto the grid, read state growing guides, check side profile, export PNG." },
] as const;

export function RootsLanding() {
  const [params] = useSearchParams();
  const upload = params.get("mode") === "upload";
  const uploadQuery = upload ? "?mode=upload" : "";
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const [videoFallback, setVideoFallback] = useState(false);

  const applyVideoPlaybackRate = useCallback(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    video.playbackRate = reducedMotion ? 1 : LANDING_VIDEO_PLAYBACK_RATE;
  }, []);

  const ensureVideoPlaying = useCallback(async () => {
    const video = bgVideoRef.current;
    if (!video || videoFallback) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setVideoFallback(true);
      return;
    }

    applyVideoPlaybackRate();
    try {
      await video.play();
      video.removeAttribute("poster");
    } catch {
      setVideoFallback(true);
    }
  }, [applyVideoPlaybackRate, videoFallback]);

  useEffect(() => {
    applyVideoPlaybackRate();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      applyVideoPlaybackRate();
      if (mq.matches) setVideoFallback(true);
      else void ensureVideoPlaying();
    };
    mq.addEventListener("change", onMotionChange);
    return () => mq.removeEventListener("change", onMotionChange);
  }, [applyVideoPlaybackRate, ensureVideoPlaying]);

  useEffect(() => {
    void ensureVideoPlaying();
    const video = bgVideoRef.current;
    if (!video) return;

    const onReady = () => void ensureVideoPlaying();
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, [ensureVideoPlaying]);

  return (
    <div className="designer-root rr-landing">
      <div
        className={`rr-landing-bg${videoFallback ? " rr-landing-bg--static" : ""}`}
        aria-hidden
      >
        {!videoFallback && (
          <video
            ref={bgVideoRef}
            className="rr-landing-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={isMobile ? undefined : LANDING_VIDEO_POSTER}
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden
            onLoadedMetadata={applyVideoPlaybackRate}
            onPlaying={() => bgVideoRef.current?.removeAttribute("poster")}
          >
            <source src={LANDING_VIDEO_SRC} type="video/mp4" />
          </video>
        )}
        <div className="rr-landing-bg-scrim" />
      </div>

      <header className="designer-top-bar rr-landing-top rr-site-top">
        <Link to="/" className="designer-top-brand">
          NTR LVR
        </Link>
        <AppNav variant="dark" />
        <div className="designer-top-bar-end">
          <EvergreenHeaderLink compact={isMobile} />
        </div>
      </header>

      <main className="rr-landing-main">
        <header className="rr-landing-intro rr-landing-hero">
          <h1>Design your dream space</h1>
          <p className="rr-landing-tagline">One plant at a time.</p>
        </header>

        <section className="rr-landing-states" aria-labelledby="states-heading">
          <div className="rr-landing-states-head">
            <h2 id="states-heading">Where are you growing?</h2>
            <p className="rr-landing-states-lead">
              Choose a state to open the designer with a curated regional catalog.
            </p>
            <p className="rr-landing-states-swipe-hint" aria-hidden>
              Swipe to explore states
            </p>
          </div>
          <div className="rr-state-grid">
            {DESIGNER_STATES.map((st, index) => {
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
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
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

        <EvergreenInstallCta landing />
      </main>

      <footer className="rr-landing-footer">
        <p className="rr-landing-footer-note">
          Plan in NTR LVR · install with{" "}
          <a
            href={EVERGREEN_SOLUTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Evergreen Solutions FL
          </a>{" "}
          — native restoration and land management in Florida.
        </p>
      </footer>
    </div>
  );
}
