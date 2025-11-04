import type { EventBusKey } from "@vueuse/core";

export const notificationKey: EventBusKey<"error" | "success"> =
	Symbol("notification");
