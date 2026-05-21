export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return new Response(`Upstream error: ${response.status}`, { status: response.status });
      }
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 500 });
    }
  },
};
