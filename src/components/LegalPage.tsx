import React, { useEffect } from 'react';
import { ArrowLeft, Mail, ShieldCheck, Sparkles } from 'lucide-react';

type LegalPageKind = 'privacy' | 'terms';

interface LegalPageProps {
  kind: LegalPageKind;
}

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

const LAST_UPDATED = 'September 26, 2026';

const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section className="space-y-2.5">
    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm sm:text-[15px] leading-7 text-slate-600">{children}</div>
  </section>
);

const PrivacyContent = () => (
  <>
    <LegalSection title="1. Overview">
      <p>
        This Privacy Policy explains how AU Toolkit processes information when you verify access, sign in,
        create content, and synchronize your workspace. AU Toolkit only uses information needed to provide,
        secure, and maintain the service.
      </p>
    </LegalSection>

    <LegalSection title="2. Information we process">
      <ul className="list-disc pl-5 space-y-2 marker:text-purple-500">
        <li>
          <strong className="text-slate-800">Account information:</strong> your Firebase user ID, email
          address, sign-in provider, and basic profile information returned by Google Sign-In or supplied for
          email/password authentication, such as display name or profile photo when available.
        </li>
        <li>
          <strong className="text-slate-800">Buyer and entitlement information:</strong> the buyer email you
          submit, account/access status, relevant purchase or expiration dates, and device type, label, and a
          persistent device identifier used to verify permitted access.
        </li>
        <li>
          <strong className="text-slate-800">Workspace information:</strong> folders, tabs, saved projects and
          history, generator form inputs, preferences, presets, custom stickers, and other user assets or
          references you choose to save.
        </li>
        <li>
          <strong className="text-slate-800">Media:</strong> avatars, wallpapers, images, stickers, or other
          files you choose to upload. When Firebase Storage is available, uploaded media is stored there and a
          stable reference is saved with your workspace.
        </li>
        <li>
          <strong className="text-slate-800">Local application data:</strong> authentication and entitlement
          state, device information, preferences, and cached workspace or asset data stored in your browser's
          local or session storage to keep the application working between visits.
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="3. How we use information">
      <p>We use this information to:</p>
      <ul className="list-disc pl-5 space-y-1.5 marker:text-purple-500">
        <li>authenticate your account and verify that you are entitled to access AU Toolkit;</li>
        <li>load, save, and synchronize your workspace across browsers or devices signed in to the same account;</li>
        <li>process user-selected media and generate previews or exports requested by you;</li>
        <li>protect accounts, enforce device/access limits, diagnose errors, and maintain service reliability.</li>
      </ul>
      <p>
        Google Sign-In is used only for authentication and basic account identity. AU Toolkit does not request
        access to your Gmail, Google Drive, contacts, or unrelated Google account content.
      </p>
    </LegalSection>

    <LegalSection title="4. Services used to operate AU Toolkit">
      <p>
        AU Toolkit uses service providers that process data on our behalf: Google Firebase Authentication for
        sign-in, Cloud Firestore for workspace synchronization, Firebase Storage for user-selected media when
        available, Google Apps Script and Google Sheets for buyer entitlement verification, and Netlify for web
        hosting and serverless request handling. Their handling of data is also governed by their respective
        privacy and security terms.
      </p>
    </LegalSection>

    <LegalSection title="5. Sharing and sale of data">
      <p>
        We do not sell your personal information. Information is shared only with the service providers above
        as necessary to operate AU Toolkit, when required by law, or when needed to protect the service and its
        users. Content you create is not published by AU Toolkit unless you choose to export or share it.
      </p>
    </LegalSection>

    <LegalSection title="6. Retention and your choices">
      <p>
        Account and workspace data may be retained while your account or entitlement is active and as needed to
        provide synchronization, security, and recovery. Browser-local data remains on your device until it is
        cleared by you or the application. You may contact us to ask about access, correction, or deletion of
        personal data, subject to identity verification and legal or operational retention requirements.
      </p>
    </LegalSection>

    <LegalSection title="7. Security and policy updates">
      <p>
        We use reasonable technical and organizational safeguards, but no internet service can guarantee
        absolute security. We may update this policy when the service or legal requirements change. The latest
        version and its effective date will remain available on this page.
      </p>
    </LegalSection>
  </>
);

const TermsContent = () => (
  <>
    <LegalSection title="1. Acceptance of these terms">
      <p>
        By accessing or using AU Toolkit, you agree to these Terms of Service. If you do not agree, do not use
        the service. You must provide accurate account and buyer-verification information and use an account you
        are authorized to control.
      </p>
    </LegalSection>

    <LegalSection title="2. Service and access">
      <p>
        AU Toolkit provides creative tools for producing social-media-style previews and image exports. Access
        may require a valid purchase or entitlement and is tied to the supported account and device rules shown
        during verification. You are responsible for keeping your sign-in credentials secure and for activity
        performed through your account.
      </p>
    </LegalSection>

    <LegalSection title="3. Your content">
      <p>
        You retain responsibility for text, images, avatars, stickers, and other content you enter or upload.
        You grant AU Toolkit only the limited permission necessary to process, store, synchronize, preview, and
        export that content at your request. You must have the rights and permissions required to use your
        content and must not upload unlawful, infringing, deceptive, or harmful material.
      </p>
    </LegalSection>

    <LegalSection title="4. Acceptable use">
      <p>You must not:</p>
      <ul className="list-disc pl-5 space-y-1.5 marker:text-purple-500">
        <li>attempt to bypass buyer verification, account restrictions, or service security;</li>
        <li>access another person's workspace or credentials without authorization;</li>
        <li>use the service to impersonate, harass, defraud, or violate the rights of others;</li>
        <li>interfere with the service, distribute malicious code, or abuse automated access;</li>
        <li>resell or redistribute access except with written permission from AU Toolkit.</li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Third-party platforms and services">
      <p>
        AU Toolkit is an independent creative tool and is not endorsed by or affiliated with Instagram, Meta,
        WhatsApp, X, TikTok, LINE, Spotify, Apple, or other depicted platforms. Firebase, Google, and Netlify
        services may be subject to their own terms. You are responsible for complying with applicable platform
        rules when using or sharing exported content.
      </p>
    </LegalSection>

    <LegalSection title="6. Availability and changes">
      <p>
        We may maintain, update, suspend, or discontinue parts of the service when reasonably necessary. We do
        not guarantee uninterrupted or error-free availability. We may update these terms, and continued use
        after an updated version becomes effective constitutes acceptance of the revised terms.
      </p>
    </LegalSection>

    <LegalSection title="7. Disclaimer and limitation">
      <p>
        AU Toolkit is provided on an “as is” and “as available” basis to the extent permitted by law. You are
        responsible for reviewing generated content before publishing or relying on it. To the maximum extent
        permitted by applicable law, AU Toolkit is not liable for indirect, incidental, special, or consequential
        loss arising from use of the service or loss of user-controlled content.
      </p>
    </LegalSection>

    <LegalSection title="8. Suspension and termination">
      <p>
        Access may be suspended or terminated for material violations of these terms, fraudulent access,
        security threats, or expiration of the applicable entitlement. Provisions that by nature should survive
        termination, including responsibility for content and limitations of liability, remain effective.
      </p>
    </LegalSection>
  </>
);

export const LegalPage: React.FC<LegalPageProps> = ({ kind }) => {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const description = isPrivacy
    ? 'How AU Toolkit handles account, access, workspace, and media data.'
    : 'The rules and responsibilities for using AU Toolkit.';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — AU Toolkit`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/40">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-28 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 group" aria-label="Back to AU Toolkit">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 p-[2px] shadow-lg shadow-purple-950/50">
              <span className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </span>
            </span>
            <span>
              <span className="block font-extrabold tracking-tight">AU Toolkit</span>
              <span className="block text-[11px] text-slate-400">Creative workspace</span>
            </span>
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to app</span>
          </a>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 text-purple-200 text-xs font-semibold mb-5">
            <ShieldCheck className="w-4 h-4" />
            Public legal information
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">{description}</p>
          <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <article className="rounded-3xl border border-white/10 bg-white/[0.97] shadow-2xl shadow-black/30 px-5 py-7 sm:px-10 sm:py-10 space-y-8 sm:space-y-10">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}

          <section className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-4 sm:px-5">
            <h2 className="font-bold text-slate-900">Contact</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Questions about {isPrivacy ? 'privacy or your data' : 'these terms'} can be sent to:
            </p>
            <a href="mailto:autoolkit@gmail.com" className="mt-2 inline-flex items-center gap-2 font-semibold text-purple-700 hover:text-purple-900 transition-colors">
              <Mail className="w-4 h-4" /> autoolkit@gmail.com
            </a>
          </section>
        </article>

        <nav className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400" aria-label="Legal pages">
          <a href="/privacy" className={`hover:text-white transition-colors ${isPrivacy ? 'text-white font-semibold' : ''}`}>Privacy Policy</a>
          <span aria-hidden="true">•</span>
          <a href="/terms" className={`hover:text-white transition-colors ${!isPrivacy ? 'text-white font-semibold' : ''}`}>Terms of Service</a>
          <span aria-hidden="true">•</span>
          <a href="mailto:autoolkit@gmail.com" className="hover:text-white transition-colors">Contact</a>
        </nav>
        <p className="mt-5 text-center text-xs text-slate-600">© {new Date().getFullYear()} AU Toolkit</p>
      </main>
    </div>
  );
};

