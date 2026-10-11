import { navigation, formats, features, purchaseSteps, faqs } from '../data/landingContent';
import { useLandingLanguage } from './useLandingLanguage';

const englishFormats = [
  ['Everyday dialogue, read receipts, and the little details that bring a story to life.', 'Personal & group chats'],
  ['Avatars, read indicators, and the familiar look of a LINE conversation.', 'Familiar conversations'],
  ['From quick replies to long conversations in direct messages.', 'Stories behind the DMs'],
];
const englishFeatures = [
  ['One story, many formats', 'WhatsApp, LINE, Instagram, and more social media formats in one editor.'],
  ['Characters you create', 'Names, avatars, status, themes, and chat colors that match your characters.'],
  ['Typography that fits', 'Adjust text size and style for conversations that are easy to read.'],
  ['Keep the next episode going', 'Organize project folders and save character settings without starting over.'],
  ['See changes as you write', 'Dialogue and appearance changes show up immediately in the preview.'],
  ['Ready to share as an image', 'Export your conversations as PNG or JPG images for your stories.'],
];
const englishSteps = [
  ['Choose your access', 'Select an available plan, then complete payment through Lynk.id.'],
  ['Use your Google account email', 'Enter the same email as the Google account you will use to sign in.'],
  ['Sign in and start your story', 'Once payment is complete and access has synced, sign in to the editor with that account.'],
];
const englishFaqs = [
  ['Is AU Toolkit a chat app or an AI story writer?', 'AU Toolkit is a visual editor for fictional conversations and content. No messages are sent to other people. You write the story and dialogue yourself.'],
  ['When does my access period begin?', 'Access starts on your Lynk.id purchase date, rather than your first login: 30 days for one month, 90 days for three months, and 365 days for one year. You can check the expiry date after your access is verified.'],
  ['Which email should I use at checkout?', 'Use the Google account email you will use to sign in. If your purchase email is incorrect or different, contact support with your invoice for verification.'],
  ['Can I use it on my phone and laptop?', 'Yes, in a browser on multiple phones and laptops. Sign in with the account matching your purchase email and an active subscription. There are no phone or laptop slot limits, and switching devices does not require a reset.'],
  ['How do I renew my access?', 'Purchase an available plan again using the same email. Remaining days are not automatically added to the new period, so check your expiry date before renewing.'],
  ['Will exported images stay sharp on social media?', 'You can download PNG or JPG images. The final appearance after uploading also depends on the social platform\'s image compression.'],
  ['Do uploaded photos sync across devices?', 'Uploaded photos are currently stored locally in the browser for that account. They are not automatically available in another browser or device.'],
];

export function useLandingContent() {
  const { language } = useLandingLanguage();
  if (language === 'id') return { navigation, formats, features, purchaseSteps, faqs };
  return {
    navigation: navigation.map((item, i) => ({ ...item, label: ['Format Gallery', 'Features', 'How to Buy', 'Plans', 'FAQ'][i] })),
    formats: formats.map((item, i) => ({ ...item, description: englishFormats[i][0], tag: englishFormats[i][1] })),
    features: features.map((item, i) => ({ ...item, title: englishFeatures[i][0], description: englishFeatures[i][1] })),
    purchaseSteps: purchaseSteps.map((item, i) => ({ ...item, title: englishSteps[i][0], description: englishSteps[i][1] })),
    faqs: faqs.map((item, i) => ({ ...item, question: englishFaqs[i][0], answer: englishFaqs[i][1] })),
  };
}
