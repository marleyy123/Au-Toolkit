export function netlifyAdapter(handler) {
  return async function (event, context) {
    const origin = String(event.headers?.origin || event.headers?.Origin || '*');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-country, x-nf-country, x-vercel-ip-country',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    };

    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
      };
    }

    const reqHeaders = {};
    if (event.headers) {
      for (const [key, value] of Object.entries(event.headers)) {
        reqHeaders[key.toLowerCase()] = value;
      }
    }

    let parsedBody = null;
    if (event.body) {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      try {
        parsedBody = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        parsedBody = raw;
      }
    }

    const req = {
      method: event.httpMethod,
      headers: reqHeaders,
      body: parsedBody,
      query: event.queryStringParameters || {},
      socket: {
        remoteAddress: reqHeaders['client-ip'] || reqHeaders['x-forwarded-for'] || ''
      }
    };

    let statusCode = 200;
    const responseHeaders = { ...corsHeaders };
    let responseBody = '';

    const res = {
      statusCode: 200,
      setHeader(name, val) {
        responseHeaders[name] = val;
      },
      end(chunk) {
        statusCode = res.statusCode;
        responseBody = chunk !== undefined && chunk !== null ? String(chunk) : '';
      }
    };

    try {
      await handler(req, res);
    } catch (err) {
      console.error('[netlify-adapter] Uncaught error:', err);
      return {
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({ success: false, reason: 'INTERNAL_SERVER_ERROR' })
      };
    }

    return {
      statusCode,
      headers: responseHeaders,
      body: responseBody
    };
  };
}
