import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading your space...",
  "Selecting your guild...",
  "Mapping the layers...",
];

export function BuildLoading() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timers = MESSAGES.map((_, i) =>
      setTimeout(() => setMsgIndex(i), i * 900),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="build-loading" aria-live="polite">
      <svg
        className="build-loading-vine"
        viewBox="0 0 80 100"
        aria-hidden
      >
        <path
          className="build-loading-stem"
          d="M40 95 Q40 60 40 35"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          className="build-loading-bloom"
          cx="40"
          cy="28"
          r="12"
          fill="var(--color-accent-warm)"
          opacity="0.85"
        />
      </svg>
      <p className="build-loading-msg">{MESSAGES[msgIndex]}</p>
    </div>
  );
}
