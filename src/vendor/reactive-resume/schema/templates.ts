import z from "zod";

export const templateSchema = z.enum([
  "azurill",
  "bronzor",
  "chikorita",
  "ditgar",
  "ditto",
  "gengar",
  "glalie",
  "kakuna",
  "lapras",
  "leafish",
  "meowth",
  "onyx",
  "pikachu",
  "rhyhorn",
  "scizor",
  "azurill-zh",
  "bronzor-zh",
  "chikorita-zh",
  "ditgar-zh",
  "ditto-zh",
  "gengar-zh",
  "glalie-zh",
  "kakuna-zh",
  "lapras-zh",
  "leafish-zh",
  "meowth-zh",
  "onyx-zh",
  "pikachu-zh",
  "rhyhorn-zh",
  "scizor-zh",
]);

export type Template = z.infer<typeof templateSchema>;
export type BaseTemplate = Exclude<Template, `${string}-zh`>;

export const getBaseTemplateId = (template: Template): BaseTemplate =>
  (template.endsWith("-zh") ? template.slice(0, -3) : template) as BaseTemplate;
