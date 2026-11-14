import { createHandler } from '../../api/regional-pricing.js';
import { netlifyAdapter } from '../lib/netlify-adapter.mjs';

export const handler = netlifyAdapter(createHandler());
