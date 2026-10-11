import { useEffect } from 'react';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { FormatGallery } from './components/FormatGallery';
import { FeaturesSection } from './components/FeaturesSection';
import { PurchaseSection } from './components/PurchaseSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { LandingFooter } from './components/LandingFooter';
import './landing.css';
import { useLandingLanguage } from './hooks/useLandingLanguage';

export default function LandingPage() {
  const { language, copy } = useLandingLanguage();
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousTitle = document.title;
    document.documentElement.lang = language;
    document.title = copy('AU Toolkit | Editor Visual Cerita Alternate Universe', 'AU Toolkit | Visual Editor for Alternate Universe Stories');
    return () => { document.documentElement.lang = previousLang; document.title = previousTitle; };
  }, [language]);
  useEffect(() => {
    document.documentElement.classList.add('au-landing-document');
    let scrollFrame = 0;
    const scrollToHash = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        try {
          const id = decodeURIComponent(window.location.hash.slice(1));
          if (id) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
        } catch {
          // Malformed URL fragments should not interrupt the landing page.
        }
      });
    };
    // Native fragment scrolling can run before this lazy-loaded page is mounted.
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener('hashchange', scrollToHash);
      document.documentElement.classList.remove('au-landing-document');
    };
  }, []);
  return <div className="au-landing"><a className="landing-skip-link" href="#landing-content">{copy('Lewati ke konten', 'Skip to content')}</a><LandingHeader /><main id="landing-content"><LandingHero /><FormatGallery /><FeaturesSection /><PurchaseSection /><PricingSection /><FaqSection /></main><LandingFooter /></div>;
}
