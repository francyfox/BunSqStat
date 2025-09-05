import { treaty } from "@elysiajs/eden";
import type { EdenApp } from "server";

export const api = treaty<EdenApp>("localhost:3000");
