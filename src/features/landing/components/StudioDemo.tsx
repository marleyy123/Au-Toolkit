import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Eye, MessageSquare, RotateCcw, Send, SlidersHorizontal, UserRound } from 'lucide-react';
import { WhatsAppChatPreview } from '../../whatsapp/components/WhatsAppChatPreview';
import { whatsappDemo } from '../data/demoData';

export function StudioDemo() {
  const [data, setData] = useState(whatsappDemo);
  const [tab, setTab] = useState<'karakter' | 'tampilan'>('karakter');
  const [mobilePanel, setMobilePanel] = useState<'preview' | 'settings'>('preview');
  const [draft, setDraft] = useState('Gue udah di depan lobi cafe, ya...');
  const [scale, setScale] = useState(0.8);
  const frameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 380));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const addMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setData(current => ({ ...current, messages: [...current.messages.slice(-3), { id: crypto.randomUUID(), sender: 'outgoing', text: draft.trim(), time: '16:46', status: 'read', type: 'text' }] }));
    setDraft('');
  };
  return <div className="landing-studio" aria-label="Demo editor AU Toolkit">
    <div className="landing-studio-bar"><div><MessageSquare size={16} /><span>Hujan di Kemang</span><span className="landing-project-chapter">/ Chapter 04</span></div><span className="landing-live"><span />Live preview</span></div>
    <div className="landing-demo-mobile-tabs" role="tablist" aria-label="Panel demo">
      <button role="tab" aria-selected={mobilePanel === 'preview'} onClick={() => setMobilePanel('preview')}><Eye size={15} />Pratinjau</button>
      <button role="tab" aria-selected={mobilePanel === 'settings'} onClick={() => setMobilePanel('settings')}><SlidersHorizontal size={15} />Pengaturan</button>
    </div>
    <div className={`landing-studio-body landing-mobile-panel-${mobilePanel}`}>
      <div className="landing-demo-settings"><div className="landing-demo-heading"><span>Detail percakapan</span><span>WhatsApp</span></div>
        <div className="landing-demo-tabs" role="tablist" aria-label="Pengaturan demo">
          <button role="tab" aria-selected={tab === 'karakter'} onClick={() => setTab('karakter')}><UserRound size={14} />Karakter</button>
          <button role="tab" aria-selected={tab === 'tampilan'} onClick={() => setTab('tampilan')}><SlidersHorizontal size={14} />Tampilan</button>
        </div>
        {tab === 'karakter' ? <div className="landing-demo-fields">
          <label>Nama penerima<input maxLength={35} value={data.contactName} onChange={event => setData({ ...data, contactName: event.target.value })} /></label>
          <label className="landing-demo-checkbox"><input type="checkbox" checked={data.isOnline} onChange={event => setData({ ...data, isOnline: event.target.checked })} /><span>Tampilkan status online</span></label>
          <div className="landing-demo-character"><span className="landing-initials">RS</span><div><strong>Raka Sanjaya</strong><span>Pengirim cerita</span></div><CheckCheck size={17} /></div>
        </div> : <div className="landing-demo-fields">
          <label className="landing-demo-checkbox"><input type="checkbox" checked={data.theme === 'dark'} onChange={event => setData({ ...data, theme: event.target.checked ? 'dark' : 'light' })} /><span>Mode gelap</span></label>
          <label>Warna pesan pengirim<input aria-label="Warna pesan pengirim" type="color" value={data.senderBubbleColor || '#d9fdd3'} onChange={event => setData({ ...data, senderBubbleColor: event.target.value })} /></label>
        </div>}
        <form onSubmit={addMessage} className="landing-demo-composer"><label htmlFor="landing-dialogue">Dialog berikutnya</label><textarea id="landing-dialogue" rows={2} maxLength={220} value={draft} onChange={event => setDraft(event.target.value)} /><div><button type="button" className="landing-icon-button" title="Reset demo" aria-label="Reset demo" onClick={() => { setData(whatsappDemo); setDraft('Gue udah di depan lobi cafe, ya...'); }}><RotateCcw size={16} /></button><button className="landing-button landing-button-primary" type="submit" disabled={!draft.trim()}><Send size={14} />Tambah dialog</button></div></form>
        <div className="landing-demo-note"><Check size={14} /><span>Dialog fiktif. Ceritanya tetap milikmu.</span></div>
      </div>
      <div className="landing-demo-canvas"><div className="landing-demo-preview" ref={frameRef}><div style={{ width: 380, height: 475, transform: `scale(${scale})`, transformOrigin: 'top left' }}><WhatsAppChatPreview data={data} /></div></div><span className="landing-canvas-caption">Percakapan dalam cerita, bukan pesan sungguhan.</span></div>
    </div>
  </div>;
}
