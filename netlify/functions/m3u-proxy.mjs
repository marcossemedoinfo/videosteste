const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254']);
const PRIVATE_IPV4_RE = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
const MAX_BYTES = 5 * 1024 * 1024;

function isAllowedTarget(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || PRIVATE_IPV4_RE.test(host)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default async (req) => {
  const targetUrl = new URL(req.url).searchParams.get('url');
  if (!targetUrl || !isAllowedTarget(targetUrl)) {
    return Response.json({ error: 'URL inválida ou não permitida.' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FutStream-Playlist-Reader/1.0' },
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const text = await upstream.text();
    if (text.length > MAX_BYTES) {
      return new Response('Playlist excede o limite de 5 MB.', { status: 413 });
    }

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(`Falha ao buscar lista: ${err.message}`, { status: 502 });
  }
};

export const config = {
  method: ['GET'],
};
