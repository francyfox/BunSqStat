import type { Mutable } from "@/utils/object";

const model = {
	fields: ["id", "listen", "active"],
	types: ["TAG", "TEXT", "TEXT"],
} as const;

type TModel = typeof model;

export const ParserModel = model as Mutable<TModel>;

export type TParserModel = typeof ParserModel;
