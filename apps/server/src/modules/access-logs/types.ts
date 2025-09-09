import { type Static, t } from "elysia";

export interface getLogParams {
	search?: string;
	page?: number;
	fields?: string[];
}

export const AccessLogSchema = t.Object({
	timestamp: t.String(),
	duration: t.String(),
	clientIP: t.String(),
	resultType: t.String(),
	resultStatus: t.String(),
	bytes: t.String(),
	method: t.String(),
	url: t.String(),
	user: t.String(),
	hierarchyType: t.String(),
	hierarchyHost: t.String(),
	contentType: t.String(),
});

export type TAccessLog = Static<typeof AccessLogSchema>;
