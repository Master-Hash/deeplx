
import { Hono } from "hono";
import { query } from "./dist/index.js";
// import { env, getRuntimeKey } from 'hono/adapter'
import type { StatusCode } from "hono/utils/http-status";

const app = new Hono();

app.use(async (c, next) => {
  await next();
  c.res.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  c.res.headers.set("content-security-policy", "default-src 'none'");
  c.res.headers.set("x-content-type-options", "nosniff");
});

app.get("/", (c) =>
  c.text("Hello from a friend of a generous hamster")
);

app.post("/translate", async (c) => {
  const r = await c.req.json();
  const d = await query(r);
  return c.json(d, d.code as StatusCode);
});

app.post("/:session/translate", async (c) => {
  const session = c.req.param('session');
  const r = await c.req.json();
  const d = await query(r, {
    proxyEndpoint: "https://api.deepl.com/jsonrpc",
    customHeader: {
      Cookie: `dl_session=${session}`
    }
  });
  return c.json(d, d.code as StatusCode);
});

Deno.serve({ port: 1188 }, app.fetch);
