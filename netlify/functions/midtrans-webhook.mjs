import { createMidtransHandler } from '../../lib/midtrans.js';
import { netlifyAdapter } from '../lib/netlify-adapter.mjs';

export const handler = netlifyAdapter(createMidtransHandler({ webhook: true }));
