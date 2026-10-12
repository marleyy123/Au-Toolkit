import { ArrowUpRight } from 'lucide-react';
import { landingLinks } from '../../data/landingContent';
import { useLandingContent } from '../../hooks/useLandingContent';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';
import { SectionHeading } from '../shared/SectionHeading';

export function FormatGallery() {
  const { formats } = useLandingContent();
  const { copy } = useLandingLanguage();
  return <section className="landing-section landing-gallery" id="galeri-format"><div className="landing-container">
    <SectionHeading eyebrow={copy('Banyak dunia, satu cerita', 'Many worlds, one story')} title={copy('Pilih tempat dialogmu hidup.', 'Give your dialogue a place to live.')} description={copy('Dari chat yang akrab sampai DM yang tak terduga. Temukan format yang cocok untuk adeganmu.', 'From familiar chats to unexpected DMs. Find the format that fits your scene.')} />
    <div className="landing-format-grid">{formats.map(format => <article className="landing-format" key={format.id}>
      <div className={`landing-format-image landing-format-${format.id}`}><img src={format.image} alt={copy(`Contoh hasil percakapan fiktif ${format.name} dari AU Toolkit`, `Example fictional ${format.name} conversation made with AU Toolkit`)} width={380} height={475} loading="lazy" /></div>
      <div className="landing-format-title"><h3><span style={{ background: format.color }} />{format.name}</h3><a href={landingLinks.editor} title={copy(`Buka editor ${format.name}`, `Open ${format.name} editor`)} aria-label={copy(`Buka editor ${format.name}`, `Open ${format.name} editor`)}><ArrowUpRight size={19} /></a></div>
      <p>{format.description}</p><span className="landing-format-tag">{format.tag}</span>
    </article>)}</div>
  </div></section>;
}
