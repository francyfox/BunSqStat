import { treaty } from "@elysiajs/eden";
import type { EdenApp } from "server";

// In production, API requests will be proxied through Caddy at /api/*
// In development, they go directly to localhost:3000
const baseUrl = process.env.NODE_ENV === "production" ? "/api" : "localhost:3000";

export const api = treaty<EdenApp>(baseUrl);
