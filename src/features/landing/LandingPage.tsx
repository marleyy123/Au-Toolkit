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
    return () => { document.documentElement.classList.remove('au-landing-document'); document.title = previousTitle; };
  }, []);
  return <div className="au-landing"><a className="landing-skip-link" href="#landing-content">Lewati ke konten</a><LandingHeader /><main id="landing-content"><LandingHero /><FormatGallery /><FeaturesSection /><PurchaseSection /><PricingSection /><FaqSection /></main><LandingFooter /></div>;
}
