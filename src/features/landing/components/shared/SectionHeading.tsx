interface Props { eyebrow: string; title: string; description?: string; }

export function SectionHeading({ eyebrow, title, description }: Props) {
  return <div className="landing-section-heading"><span className="landing-eyebrow">{eyebrow}</span>
    <h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
