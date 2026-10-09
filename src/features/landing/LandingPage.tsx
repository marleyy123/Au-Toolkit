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

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('au-landing-document');
    const previousTitle = document.title;
    document.title = 'AU Toolkit | Editor Visual Cerita Alternate Universe';
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
      document.title = previousTitle;
    };
  }, []);
  return <div className="au-landing"><a className="landing-skip-link" href="#landing-content">Lewati ke konten</a><LandingHeader /><main id="landing-content"><LandingHero /><FormatGallery /><FeaturesSection /><PurchaseSection /><PricingSection /><FaqSection /></main><LandingFooter /></div>;
}
