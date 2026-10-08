import { features } from '../data/landingContent';
import { SectionHeading } from './SectionHeading';

export function FeaturesSection() {
  return <section className="landing-section" id="fitur"><div className="landing-container">
    <SectionHeading eyebrow="Lebih sedikit repot" title="Fokus ke cerita. Detailnya di sini." description="Satu ruang kerja untuk karakter, percakapan, dan episode berikutnya." />
    <div className="landing-feature-grid">{features.map(({ icon: Icon, title, description }, index) => <div className="landing-feature" key={title}><span className={`landing-feature-icon landing-feature-color-${index % 3}`}><Icon size={23} strokeWidth={1.7} /></span><h3>{title}</h3><p>{description}</p></div>)}</div>
  </div></section>;
}
