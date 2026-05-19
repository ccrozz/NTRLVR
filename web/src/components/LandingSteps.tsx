const STEPS = [
  {
    num: "01",
    title: "Set your state",
    body: "We filter the catalog to species that can grow in your state's USDA range — or natives documented for your area.",
  },
  {
    num: "02",
    title: "Pin your winter zone",
    body: "Not sure? Use ZIP lookup or regional shortcuts. Skip it to browse everything in your state.",
  },
  {
    num: "03",
    title: "Layer your guild",
    body: "Filter by canopy layer, edibles, and natives. Search by common name, family, or guild role.",
  },
] as const;

export function LandingSteps() {
  return (
    <section className="landing-steps" aria-labelledby="steps-heading">
      <div className="landing-steps-header">
        <h2 id="steps-heading">How it works</h2>
        <p>Three steps from blank yard to a climate-aware plant list.</p>
      </div>
      <ol className="landing-steps-grid">
        {STEPS.map((step) => (
          <li key={step.num} className="landing-step-card">
            <span className="landing-step-num">{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
