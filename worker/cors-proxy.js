const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' } });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': new URL(imageUrl).origin,
        },
      });
      if (!response.ok) {
        return new Response(`Upstream error: ${response.status}`, { status: response.status, headers: CORS_HEADERS });
      }
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 500, headers: CORS_HEADERS });
    }
  },
};
