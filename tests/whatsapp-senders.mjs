import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

await build({
  stdin: {
    contents: `import assert from 'node:assert/strict';
      import React from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {WhatsAppChatPreview} from './src/features/whatsapp/components/WhatsAppChatPreview';
      import {INITIAL_WHATSAPP_CHAT_DATA} from './src/data/defaultTemplates';
      import {LanguageContext} from './src/context/LanguageContext';
      import {isSameWhatsAppSender, resolveWhatsAppGroupSenders} from './src/features/whatsapp/messageSenders';
      const message = (id, fields = {}) => ({id, sender: 'incoming', type: 'text', text: 'Hello', time: '12:00', ...fields});
      const photo = message('photo', {type: 'image', senderName: 'Karun', senderColor: '#123456'});
      const original = [photo, message('text'), message('named', {senderName: 'Karun'}), message('different', {senderName: 'Maya'})];
      const resolved = resolveWhatsAppGroupSenders(original);
      assert.equal(resolved[1].senderName, 'Karun');
      assert.equal(resolved[1].senderColor, '#123456');
      assert.equal(original[1].senderName, undefined, 'Resolving preview must not mutate stored messages');
      assert(isSameWhatsAppSender(resolved[0], resolved[1]));
      assert(isSameWhatsAppSender(resolved[1], resolved[2]));
      assert(!isSameWhatsAppSender(resolved[2], resolved[3]), 'Different group participants need separate bubbles');
      for (const boundary of [message('outgoing', {sender: 'outgoing'}), message('date', {type: 'date_divider'}), message('system', {sender: 'system', type: 'system'})]) {
        const sequence = resolveWhatsAppGroupSenders([photo, boundary, message('after')]);
        assert.equal(sequence[2].senderName, undefined, 'Do not inherit across an interruption');
      }
      assert(isSameWhatsAppSender(message('a', {sender: 'me'}), message('b', {sender: 'outgoing'})));
      const markup = (messages, language = 'en') => renderToStaticMarkup(
        <LanguageContext.Provider value={{language, setLanguage: () => {}, t: key => key}}>
          <WhatsAppChatPreview data={{...INITIAL_WHATSAPP_CHAT_DATA, isGroupChat: true, messages}}/>
        </LanguageContext.Provider>);
      const html = markup(original);
      assert.equal((html.match(/>Karun</g) || []).length, 1, 'Name appears once for photo + consecutive text');
      assert.equal((html.match(/>Maya</g) || []).length, 1, 'A different participant gets their own label');
      assert.equal((markup([photo, message('out', {sender: 'outgoing'}), photo]).match(/>Karun</g) || []).length, 2);
      assert(markup([message('unnamed')], 'en').includes('>User<'));
      assert(markup([message('unnamed')], 'id').includes('>Pengguna<'));
      console.log('PASS WhatsApp: photo/text sender continuity, different participants, boundaries, immutable data, English/Indonesian labels');`,
    resolveDir: process.cwd(), loader: 'tsx',
  }, bundle: true, platform: 'node', format: 'cjs', outfile: 'dist/whatsapp-senders-test.cjs',
});
process.stdout.write(execFileSync(process.execPath, ['dist/whatsapp-senders-test.cjs'], {encoding: 'utf8'}));
