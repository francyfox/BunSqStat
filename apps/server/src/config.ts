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
		SQUID_LISTENERS: t.String({
			default: "0.0.0.0:5140",
			description:
				"Used for listen udp logs. Example: 0.0.0.0:5140,0.0.0.0:5141,...",
		}),
	}),
	t.Partial(
		t.Object({
			REDIS_HOST: t.String({ default: "localhost" }),
			REDIS_PORT: t.String({ default: "6379" }),
			BACKEND_PORT: t.String({ default: "3000" }),
			REDIS_PASSWORD: t.String(),
			REDIS_TLS_CA: t.String({ default: "/tls/ca.crt" }),
			REDIS_TLS_CERT: t.String({ default: "/tls/client.crt" }),
			REDIS_TLS_KEY: t.String({ default: "/tls/client.key" }),
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
