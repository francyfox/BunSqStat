import { type Static, Type as t } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import Ajv from "ajv";

const ajv = new Ajv();

export const configSchema = t.Object({
	SQUID_HOST: t.String(),
	SQUID_PORT: t.String(),
	ACCESS_LOG: t.String(),
	CACHE_LOG: t.String(),
	REDIS_PASSWORD: t.String(),
});

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
