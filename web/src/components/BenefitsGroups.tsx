import {
  formatBenefitExpandedText,
  isExpandableBenefit,
} from "@lib/wiki-text";

const ECOSYSTEM_BENEFIT_RE =
  /nitrogen|soil|mulch|pollinat|wildlife|habitat|wind|groundcover|biodiversity|shade|drought|native|support species|accumulator|repel/i;

function partitionBenefits(items: string[]) {
  const short: string[] = [];
  const long: string[] = [];
  for (const item of items) {
    if (isExpandableBenefit(item)) long.push(item);
    else short.push(item);
  }
  return { short, long };
}

function DeepReadBlock({
  items,
  summaryLabel,
}: {
  items: string[];
  summaryLabel: string;
}) {
  if (!items.length) return null;

  return (
    <details className="benefit-deep-read">
      <summary>{summaryLabel}</summary>
      <div className="benefit-deep-read-body">
        {items.map((text, i) => (
          <div
            key={`${i}-${text.slice(0, 32)}`}
            className="benefit-deep-read-section"
          >
            {formatBenefitExpandedText(text)
              .split(/\n\n+/)
              .map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
          </div>
        ))}
      </div>
    </details>
  );
}

function BenefitGroup({
  title,
  items,
  deepReadSummary,
}: {
  title: string;
  items: string[];
  deepReadSummary: string;
}) {
  if (!items.length) return null;

  const { short, long } = partitionBenefits(items);

  return (
    <div className="benefit-group">
      <h3 className="benefit-group-title">{title}</h3>
      {short.length > 0 && (
        <ul className="detail-list">
          {short.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <DeepReadBlock items={long} summaryLabel={deepReadSummary} />
    </div>
  );
}

export function BenefitsGroups({ benefits }: { benefits: string[] }) {
  if (!benefits.length) {
    return <p className="detail-empty">No benefits listed yet.</p>;
  }

  const ecosystem = benefits.filter((b) => ECOSYSTEM_BENEFIT_RE.test(b));
  const health = benefits.filter((b) => !ecosystem.includes(b));

  const healthLong = health.filter(isExpandableBenefit).length;
  const ecosystemLong = ecosystem.filter(isExpandableBenefit).length;

  return (
    <div className="benefits-groups">
      <BenefitGroup
        title="Health & harvest"
        items={health}
        deepReadSummary={
          healthLong === 1
            ? "Read full description"
            : `Read full descriptions (${healthLong})`
        }
      />
      <BenefitGroup
        title="Soil & ecosystem"
        items={ecosystem}
        deepReadSummary={
          ecosystemLong === 1
            ? "Read full botanical & habitat notes"
            : `Read full botanical & habitat notes (${ecosystemLong})`
        }
      />
    </div>
  );
}
