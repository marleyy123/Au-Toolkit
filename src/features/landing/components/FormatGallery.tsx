import { ArrowUpRight } from 'lucide-react';
import { formats, landingLinks } from '../data/landingContent';
import { SectionHeading } from './SectionHeading';

export function FormatGallery() {
  return <section className="landing-section landing-gallery" id="galeri-format"><div className="landing-container">
    <SectionHeading eyebrow="Banyak dunia, satu cerita" title="Pilih tempat dialogmu hidup." description="Dari chat yang akrab sampai DM yang tak terduga. Temukan format yang cocok untuk adeganmu." />
    <div className="landing-format-grid">{formats.map(format => <article className="landing-format" key={format.id}>
      <div className={`landing-format-image landing-format-${format.id}`}><img src={format.image} alt={`Contoh hasil percakapan fiktif ${format.name} dari AU Toolkit`} width={380} height={475} loading="lazy" /></div>
      <div className="landing-format-title"><h3><span style={{ background: format.color }} />{format.name}</h3><a href={landingLinks.editor} title={`Buka editor ${format.name}`} aria-label={`Buka editor ${format.name}`}><ArrowUpRight size={19} /></a></div>
      <p>{format.description}</p><span className="landing-format-tag">{format.tag}</span>
    </article>)}</div>
  </div></section>;
}
