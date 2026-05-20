const STEP_COUNT = 11;

export function StepDots({ current }: { current: number }) {
  return (
    <div className="step-dots" aria-label={`Step ${current + 1} of ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <span
          key={i}
          className={`step-dots-dot${i === current ? " is-current" : i < current ? " is-done" : ""}`}
        />
      ))}
    </div>
  );
}

export { STEP_COUNT };
