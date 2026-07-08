import http from "node:http";

/**
 * Starts an Express app on an ephemeral port so tests never collide with
 * each other or with a real dev server on a fixed PORT.
 */
export async function startTestServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

/** Pulls the "name=value" pair off a Set-Cookie header so it can be replayed. */
export function firstCookiePair(res) {
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (!cookies.length) return null;
  return cookies[0].split(";")[0];
}
