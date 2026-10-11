import { useLandingContent } from '../hooks/useLandingContent';
import { useLandingLanguage } from '../hooks/useLandingLanguage';
import { SectionHeading } from './SectionHeading';

export function FeaturesSection() {
  const { features } = useLandingContent();
  const { copy } = useLandingLanguage();
  return <section className="landing-section" id="fitur"><div className="landing-container">
    <SectionHeading eyebrow={copy('Lebih sedikit repot', 'Less busywork')} title={copy('Fokus ke cerita. Detailnya di sini.', 'Focus on the story. Shape every detail.')} description={copy('Satu ruang kerja untuk karakter, percakapan, dan episode berikutnya.', 'One workspace for your characters, conversations, and next episode.')} />
    <div className="landing-feature-grid">{features.map(({ icon: Icon, title, description }, index) => <div className="landing-feature" key={title}><span className={`landing-feature-icon landing-feature-color-${index % 3}`}><Icon size={23} strokeWidth={1.7} /></span><h3>{title}</h3><p>{description}</p></div>)}</div>
  </div></section>;
}
