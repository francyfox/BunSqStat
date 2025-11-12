export type RedisFieldType = "NUMERIC" | "TAG" | "TEXT";
export type PostgresFieldType =
	| "BIGINT"
	| "INTEGER"
	| "SMALLINT"
	| "VARCHAR"
	| "TEXT"
	| "INET"
	| "TIMESTAMP"
	| "JSONB";

export type TransformFunction = (value: string) => string | number;

export interface IFormatItem {
	token: string;
	field: string;
	redisType: RedisFieldType;
	postgresType: PostgresFieldType | string;
	transform?: string;
	nullable?: boolean;
	defaultValue?: string | number | null;
}

export interface ParsedLogLine {
	[field: string]: string | number;
}

export interface CompiledParser {
	format: string;
	fields: Array<{
		field: string;
		transform?: TransformFunction;
		redisType: RedisFieldType;
		postgresType: string;
	}>;
	parse: (line: string) => ParsedLogLine;
}
