/// <reference path="../.astro/types.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
    interface Locals extends Runtime { }
}

interface Env {
    DB: D1Database;
    nf: KVNamespace;
    AUTH_SECRET: string;
    WORKER_URL: string;
    HOUSEHOLD: Fetcher;
}
