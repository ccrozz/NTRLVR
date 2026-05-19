export function LandingHero({
  speciesCount,
  locationLabel,
  matchCount,
}: {
  speciesCount: number | null;
  locationLabel: string | null;
  matchCount: number | null;
}) {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-media" aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=2400&q=80&auto=format&fit=crop"
          alt=""
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="landing-hero-scrim" aria-hidden />
      <div className="landing-hero-content">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow-dot" aria-hidden />
          Food forest &amp; permaculture plant guide
        </p>
        <h1 id="landing-title" className="landing-title">
          Grow what actually belongs in your climate
        </h1>
        <p className="landing-lead">
          Match trees, shrubs, and perennials to your state and winter zone —
          with natives, edibles, and guild roles in one living catalog.
        </p>
        <div className="landing-stats">
          {speciesCount !== null && (
            <div className="landing-stat">
              <span className="landing-stat-value">
                {speciesCount.toLocaleString()}
              </span>
              <span className="landing-stat-label">species indexed</span>
            </div>
          )}
          {locationLabel && matchCount !== null && (
            <div className="landing-stat landing-stat-active">
              <span className="landing-stat-value">
                {matchCount.toLocaleString()}
              </span>
              <span className="landing-stat-label">for {locationLabel}</span>
            </div>
          )}
        </div>
        <a href="#get-started" className="landing-cta">
          {locationLabel ? "Adjust your location" : "Choose your state"}
        </a>
      </div>
    </section>
  );
}
