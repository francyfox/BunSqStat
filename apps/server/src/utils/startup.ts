import type { Elysia } from "elysia";

export const startupMessage = (app: Elysia | any) => {
	console.log(`🕮  Swagger is active at: ${app.server?.url.origin}/swagger`);
	console.log(
		`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
	);
};
