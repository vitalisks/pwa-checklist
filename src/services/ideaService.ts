import { Template, Category, GeneratedFrom } from "../types";
import { generateUUID } from "../utils/uuid";

export const PROMPT_VERSION = "v1";

interface LLMTemplateSchema {
  title: string;
  description: string;
  categories: Array<{
    name: string;
    items: Array<{
      text: string;
      description?: string;
    }>;
  }>;
}

export type ParseError =
  | { kind: "empty" }
  | { kind: "clipboard_unavailable" }
  | { kind: "invalid_json"; raw: string }
  | { kind: "invalid_schema"; raw: string; detail: string };

export interface GeneratePromptResult {
  prompt: string;
  generatedFrom: GeneratedFrom;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  lv: "Latvian",
  ru: "Russian",
};

export function generatePrompt(
  idea: string,
  language: string,
): GeneratePromptResult {
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  const prompt = `You are helping someone create a practical, actionable checklist for the following idea:

"${idea}"

Use your knowledge of best practices, domain expertise, and real-world processes for the user mentioned topic.
Try to identify user goal and area for his need.
User might not be proficient to extend his queries, so it might require to provide additional explanations on how to achieve specific criteria or perform validation.
- For example do not just write what needs to be checked, but also assume, that user might require step based guide how to do that as he might be doing it for the first time
If there are well-known frameworks, standards, or methodologies relevant to this idea, draw on them.
Prefer depth over breadth — a focused checklist with specific, concrete steps is more useful than a generic one.
If steps require repetition over specific period, generate them as separate categories on daily periodicity basis (daily if require daily execution, weekly, mothly)
Do not include informational steps, which does not require action/control from the user or not really necessary to reach his goals

After generating, verify your output:
- Are the items specific enough to act on?
- Are any important steps missing for this particular topic?
- Do the categories cover the full scope of the idea?

Respond ONLY with a valid JSON code block using this exact schema — no explanation outside the block:

\`\`\`json
{
  "title": "string",
  "description": "string",
  "categories": [
    {
      "name": "string",
      "items": [
        { "text": "string", "description": "string" }
      ]
    }
  ]
}
\`\`\`

Rules:
- All text must be in ${languageName}.
- Include 2–5 categories with 3–8 items each.
- Each item's "description" must explain specifically how to complete that step.
- "description" fields may be empty strings but must be present.`;

  return {
    prompt,
    generatedFrom: { idea, promptVersion: PROMPT_VERSION },
  };
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
}

export function parseResponse(raw: string): Template | ParseError {
  const trimmed = stripCodeFences(raw.trim());

  if (!trimmed) {
    return { kind: "empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { kind: "invalid_json", raw: trimmed };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).title !== "string" ||
    typeof (parsed as Record<string, unknown>).description !== "string" ||
    !Array.isArray((parsed as Record<string, unknown>).categories)
  ) {
    return {
      kind: "invalid_schema",
      raw: trimmed,
      detail:
        "Missing required fields: title, description, or categories array.",
    };
  }

  const schema = parsed as LLMTemplateSchema;

  for (const cat of schema.categories) {
    if (typeof cat.name !== "string" || !Array.isArray(cat.items)) {
      return {
        kind: "invalid_schema",
        raw: trimmed,
        detail: 'Each category must have a "name" string and "items" array.',
      };
    }
    for (const item of cat.items) {
      if (typeof item.text !== "string") {
        return {
          kind: "invalid_schema",
          raw: trimmed,
          detail: 'Each item must have a "text" string.',
        };
      }
    }
  }

  const categories: Category[] = schema.categories.map((cat) => ({
    id: generateUUID(),
    name: cat.name,
    items: cat.items.map((item) => ({
      id: generateUUID(),
      text: item.text,
      description: item.description ?? "",
    })),
  }));

  return {
    id: generateUUID(),
    title: schema.title,
    description: schema.description,
    categories,
    updatedAt: Date.now(),
  };
}
