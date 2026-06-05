import { EVERGREEN_SOLUTIONS_URL } from "../lib/evergreen-partner";

type EvergreenInstallCtaProps = {
  /** Tighter copy for sidebars and sheet footers */
  compact?: boolean;
  /** Centered promo block for the designer landing page */
  landing?: boolean;
  className?: string;
};

export function EvergreenInstallCta({
  compact = false,
  landing = false,
  className = "",
}: EvergreenInstallCtaProps) {
  if (compact) {
    return (
      <p
        className={`evergreen-install-cta evergreen-install-cta--compact${className ? ` ${className}` : ""}`}
      >
        Want us to build this on your property?{" "}
        <a
          href={EVERGREEN_SOLUTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Request a quote from Evergreen Solutions FL
        </a>
      </p>
    );
  }

  if (landing) {
    return (
      <section
        className={`rr-landing-evergreen-section${className ? ` ${className}` : ""}`}
        aria-labelledby="evergreen-landing-heading"
      >
        <aside className="evergreen-install-cta evergreen-install-cta--landing">
          <div className="evergreen-install-cta-landing-inner">
            <div className="evergreen-install-cta-landing-copy">
              <p className="evergreen-install-cta-kicker">Professional install</p>
              <h2 id="evergreen-landing-heading">
                Want us to build this for you?
              </h2>
              <p className="evergreen-install-cta-lead">
                Plan in NTR LVR, then Evergreen Solutions FL installs it —
                native restoration and habitat consulting across Florida.
              </p>
            </div>
            <div className="evergreen-install-cta-landing-action">
              <a
                className="rr-btn rr-btn-primary evergreen-install-cta-btn evergreen-install-cta-btn--landing"
                href={EVERGREEN_SOLUTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Request a free quote
              </a>
              <p className="evergreen-install-cta-partner">
                <a
                  href={EVERGREEN_SOLUTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Evergreen Solutions FL
                </a>
                {" · "}UF Alumni-founded
              </p>
            </div>
          </div>
        </aside>
      </section>
    );
  }

  return (
    <aside
      className={`evergreen-install-cta${className ? ` ${className}` : ""}`}
      aria-labelledby="evergreen-install-heading"
    >
      <h3 id="evergreen-install-heading">Want us to build this for you?</h3>
      <p>
        Evergreen Solutions FL turns plans into real landscapes — native
        restoration, sustainable land management, and habitat consulting across
        Florida.
      </p>
      <a
        className="rr-btn rr-btn-secondary evergreen-install-cta-btn"
        href={EVERGREEN_SOLUTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Request a free quote
      </a>
    </aside>
  );
}
