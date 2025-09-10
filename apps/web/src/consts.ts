const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
export const WS_URL =
	import.meta.env.NODE_ENV === "production"
		? `${protocol}//${window.location.host}/api`
		: "ws://localhost:3000";
