import { INITIAL_WHATSAPP_CHAT_DATA, INITIAL_LINE_CHAT_DATA, INITIAL_INSTAGRAM_DM_DATA } from '../../../data/defaultTemplates';
import type { WhatsAppChatData, LineChatData, InstagramDMData } from '../../../types';

export const whatsappDemo: WhatsAppChatData = {
  ...INITIAL_WHATSAPP_CHAT_DATA, contactName: 'Naya Anandita', isOnline: true,
  contactAvatar: '', aspectRatio: '4:5', deviceMode: 'android', dateDivider: 'HARI INI',
  useCustomColors: true, barBgColor: '#075e54', iconColor: '#ffffff',
  messages: [
    { id: 'wa-1', sender: 'incoming', text: 'Raka, lo beneran mau balik ke Bandung sore ini tanpa pamit?', time: '16:42', type: 'text' },
    { id: 'wa-2', sender: 'outgoing', text: 'Bukan ga mau pamit, Nay. Kadang pamit cuma bikin kita ragu buat melangkah.', time: '16:44', status: 'read', type: 'text' },
    { id: 'wa-3', sender: 'incoming', text: 'Tapi payung lo masih di gue. Gue tunggu di depan peron 3 sekarang.', time: '16:45', type: 'text' },
  ],
};

export const whatsappDemoEnglish: WhatsAppChatData = {
  ...whatsappDemo, dateDivider: 'TODAY',
  messages: whatsappDemo.messages.map((message, index) => ({ ...message, text: [
    'Raka, are you really heading back to Bandung this afternoon without saying goodbye?',
    'It is not that I do not want to, Nay. Sometimes saying goodbye just makes it harder to leave.',
    'But I still have your umbrella. I am waiting in front of platform 3.',
  ][index] })),
};

export const lineDemo: LineChatData = {
  ...INITIAL_LINE_CHAT_DATA, contactName: 'Kayla', aspectRatio: '4:5',
  messages: [
    { id: 'line-1', sender: 'incoming', text: 'Kak, besok latihan teater jadi jam berapa?', time: '19:03', senderName: 'Kayla' },
    { id: 'line-2', sender: 'outgoing', text: 'Jam lima sore di auditorium lama.', time: '19:04', isRead: true },
    { id: 'line-3', sender: 'incoming', text: 'Oke. Aku bawain naskah yang kemarin, ya.', time: '19:05' },
  ],
};

export const instagramDemo: InstagramDMData = {
  ...INITIAL_INSTAGRAM_DM_DATA, name: 'Arkana', username: 'arkana.story', isActiveNow: true,
  outgoingColorMode: 'blue-purple',
  messages: [
    { id: 'ig-1', sender: 'incoming', text: 'Postingan AU kamu lewat di timeline aku tadi malam!' },
    { id: 'ig-2', sender: 'outgoing', text: 'Seriusan? Makasih banyak udah baca!', showSeen: true },
    { id: 'ig-3', sender: 'incoming', text: 'Jangan lama-lama update episode berikutnya, ya.' },
  ],
};
