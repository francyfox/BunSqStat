import { Elysia } from "elysia";
import { LogManager } from "@/modules/log-manager";

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);

await LogManager.readLogs();

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
