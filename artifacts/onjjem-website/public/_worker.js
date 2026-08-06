export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy API calls to the Railway backend (checkout, uploads, etc.)
    if (url.pathname.startsWith('/api/')) {
      const target = 'https://onjjem-production-5ef8.up.railway.app' + url.pathname + url.search;
      return fetch(new Request(target, request));
    }

    // Old landing URL goes to the homepage
    if (url.pathname === '/onjjem-landing.html') {
      return Response.redirect(url.origin + '/', 301);
    }

    // Serve static files; fall back to the app for client-side routes
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && (request.headers.get('accept') || '').includes('text/html')) {
      return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
    }
    return res;
  }
};
