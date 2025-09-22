import type { Mutable } from "@/utils/object";

const model = {
	fields: ["id", "name", "offset", "mtimeMs"],
	types: ["TAG", "TEXT SORTABLE", "NUMERIC", "NUMERIC"],
} as const;

type TModel = typeof model;

export const ParserModel = model as Mutable<TModel>;

export type TParserModel = typeof ParserModel;
