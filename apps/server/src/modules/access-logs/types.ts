import { type Static, t } from "elysia";

export interface getLogParams {
	search?: string;
	page?: number;
	sortBy?: string;
	prefix?: string;
	fields?: string[];
}

export const AccessLogSchema = t.Object({
	id: t.String(),
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
	serverIP: t.String(),
	contentType: t.String(),
	domain: t.String(),
});

export type TAccessLog = Static<typeof AccessLogSchema>;
