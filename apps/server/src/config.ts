import { type Static, Type as t } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import Ajv from "ajv";

const ajv = new Ajv();

export const configSchema = t.Intersect([
	t.Object({
		NODE_ENV: t.Union(
			[t.Literal("development"), t.Literal("production"), t.Literal("test")],
			{
				default: "development",
			},
		),
		REDIS_PASSWORD: t.String(),
	}),
	t.Partial(
		t.Object({
			SQUID_HOST: t.String(),
			SQUID_PORT: t.String(),
			REDIS_HOST: t.String({ default: "localhost" }),
			REDIS_PORT: t.String({ default: "6379" }),
			BACKEND_PORT: t.String({ default: "3000" }),
			LOG_DIR: t.String({ default: "/tmp/squid/log" }),
		}),
	),
]);

export type TConfig = Static<typeof configSchema>;
const validate = ajv.compile(configSchema);

export const checkConfig = () => {
	const data = Bun.env;

	if (!validate(data)) {
		console.error("Validation errors:", validate.errors);
	}

	return Value.Parse(configSchema, data);
};

export const config = checkConfig();
