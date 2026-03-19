/// <reference types="astro/client" />

// Cloudflare Workers environment bindings
// Access via: import { env } from "cloudflare:workers"
declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    SESSION: KVNamespace;
    ASSETS: Fetcher;
  };
}
