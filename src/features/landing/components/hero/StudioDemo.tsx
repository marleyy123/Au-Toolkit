import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Eye, MessageSquare, RotateCcw, Send, SlidersHorizontal, UserRound } from 'lucide-react';
import { WhatsAppChatPreview } from '../../../whatsapp/components/whatsappChat/WhatsAppChatPreview';
import { whatsappDemo, whatsappDemoEnglish } from '../../data/demoData';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';

export function StudioDemo() {
  const { language, copy } = useLandingLanguage();
  const demo = language === 'id' ? whatsappDemo : whatsappDemoEnglish;
  const initialDraft = copy('Gue udah di depan lobi cafe, ya...', 'I am outside the cafe lobby now...');
  const [data, setData] = useState(demo);
  const [tab, setTab] = useState<'karakter' | 'tampilan'>('karakter');
  const [mobilePanel, setMobilePanel] = useState<'preview' | 'settings'>('preview');
  const [draft, setDraft] = useState(initialDraft);
  useEffect(() => {
    setData(current => ({ ...current, dateDivider: demo.dateDivider, messages: current.messages.map(message => {
      const index = whatsappDemo.messages.findIndex(item => item.id === message.id);
      const original = index >= 0 ? whatsappDemo.messages[index] : null;
      const english = index >= 0 ? whatsappDemoEnglish.messages[index] : null;
      return original && english && (message.text === original.text || message.text === english.text)
        ? { ...message, text: demo.messages[index].text } : message;
    }) }));
    setDraft(current => ['Gue udah di depan lobi cafe, ya...', 'I am outside the cafe lobby now...'].includes(current) ? initialDraft : current);
  }, [language]);
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
  return <div className="landing-studio" aria-label={copy('Demo editor AU Toolkit', 'AU Toolkit editor demo')}>
    <div className="landing-studio-bar"><div><MessageSquare size={16} /><span>{copy('Hujan di Kemang', 'Rain in Kemang')}</span><span className="landing-project-chapter">/ Chapter 04</span></div><span className="landing-live"><span />Live preview</span></div>
    <div className="landing-demo-mobile-tabs" role="tablist" aria-label={copy('Panel demo', 'Demo panels')}>
      <button role="tab" aria-selected={mobilePanel === 'preview'} onClick={() => setMobilePanel('preview')}><Eye size={15} />{copy('Pratinjau', 'Preview')}</button>
      <button role="tab" aria-selected={mobilePanel === 'settings'} onClick={() => setMobilePanel('settings')}><SlidersHorizontal size={15} />{copy('Pengaturan', 'Settings')}</button>
    </div>
    <div className={`landing-studio-body landing-mobile-panel-${mobilePanel}`}>
      <div className="landing-demo-settings"><div className="landing-demo-heading"><span>{copy('Detail percakapan', 'Conversation details')}</span><span>WhatsApp</span></div>
        <div className="landing-demo-tabs" role="tablist" aria-label={copy('Pengaturan demo', 'Demo settings')}>
          <button role="tab" aria-selected={tab === 'karakter'} onClick={() => setTab('karakter')}><UserRound size={14} />{copy('Karakter', 'Character')}</button>
          <button role="tab" aria-selected={tab === 'tampilan'} onClick={() => setTab('tampilan')}><SlidersHorizontal size={14} />{copy('Tampilan', 'Appearance')}</button>
        </div>
        {tab === 'karakter' ? <div className="landing-demo-fields">
          <label>{copy('Nama penerima', 'Recipient name')}<input maxLength={35} value={data.contactName} onChange={event => setData({ ...data, contactName: event.target.value })} /></label>
          <label className="landing-demo-checkbox"><input type="checkbox" checked={data.isOnline} onChange={event => setData({ ...data, isOnline: event.target.checked })} /><span>{copy('Tampilkan status online', 'Show online status')}</span></label>
          <div className="landing-demo-character"><span className="landing-initials">RS</span><div><strong>Raka Sanjaya</strong><span>{copy('Pengirim cerita', 'Story sender')}</span></div><CheckCheck size={17} /></div>
        </div> : <div className="landing-demo-fields">
          <label className="landing-demo-checkbox"><input type="checkbox" checked={data.theme === 'dark'} onChange={event => setData({ ...data, theme: event.target.checked ? 'dark' : 'light' })} /><span>{copy('Mode gelap', 'Dark mode')}</span></label>
          <label>{copy('Warna pesan pengirim', 'Outgoing message color')}<input aria-label={copy('Warna pesan pengirim', 'Outgoing message color')} type="color" value={data.senderBubbleColor || '#d9fdd3'} onChange={event => setData({ ...data, senderBubbleColor: event.target.value })} /></label>
        </div>}
        <form onSubmit={addMessage} className="landing-demo-composer"><label htmlFor="landing-dialogue">{copy('Dialog berikutnya', 'Next line of dialogue')}</label><textarea id="landing-dialogue" rows={2} maxLength={220} value={draft} onChange={event => setDraft(event.target.value)} /><div><button type="button" className="landing-icon-button" title="Reset demo" aria-label="Reset demo" onClick={() => { setData(demo); setDraft(initialDraft); }}><RotateCcw size={16} /></button><button className="landing-button landing-button-primary" type="submit" disabled={!draft.trim()}><Send size={14} />{copy('Tambah dialog', 'Add dialogue')}</button></div></form>
        <div className="landing-demo-note"><Check size={14} /><span>{copy('Dialog fiktif. Ceritanya tetap milikmu.', 'Fictional dialogue. Your story stays yours.')}</span></div>
      </div>
      <div className="landing-demo-canvas"><div className="landing-demo-preview" ref={frameRef}><div style={{ width: 380, height: 475, transform: `scale(${scale})`, transformOrigin: 'top left' }}><WhatsAppChatPreview data={data} /></div></div><span className="landing-canvas-caption">{copy('Percakapan dalam cerita, bukan pesan sungguhan.', 'Conversations in a story, not real messages.')}</span></div>
    </div>
  </div>;
}
