import type { Template, Category, GeneratedFrom } from "@/shared/config";
import { generateUUID } from "@/shared/lib";
import { PROMPT_VERSION } from "../config";

export type ParseError =
  | { kind: "empty" }
  | { kind: "clipboard_unavailable" }
  | { kind: "invalid_json"; raw: string }
  | { kind: "invalid_schema"; raw: string; detail: string };

export interface GeneratePromptResult {
  prompt: string;
  generatedFrom: GeneratedFrom;
}

interface LLMTemplateSchema {
  title: string;
  description: string;
  categories: Array<{
    name: string;
    items: Array<{
      text: string;
      description?: string;
      imageLinks?: string[];
    }>;
  }>;
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

  const prompt = `You are creating a practical checklist a user will actually tick off. The user's goal:

"${idea}"

Identify the user's underlying objective and the domain it belongs to. Draw on relevant established practices, standards, frameworks, or official procedures when they apply (e.g. ISO/OSHA/NFPA standards, manufacturer guidance, certification requirements, recognized methodologies). Assume the user may be doing this for the first time and is not an expert.

## Every item MUST be checkable

A "checkable" item satisfies ALL of:
- **Starts with a concrete action verb** (Verify, Replace, Test, Inspect, Measure, Confirm, Adjust, Photograph, Document, Schedule, Locate, Tighten, Clean, Charge, Sign, Submit). Avoid "Learn", "Understand", "Be aware", "Consider", "Know", "Familiarize".
- **Has a binary done/not-done outcome** the user can decide on their own without expert judgment.
- **Names a specific target** (which device, which document, which surface, which value range) — not a generic category.
- **Completable in one short sitting**. If a step would take days or requires waiting on something external, split it into the trigger action and the verification action.

## Items to EXCLUDE

Do NOT include:
- Educational/informational steps that have no observable result ("Learn about fire safety", "Understand the regulations").
- Vague aspirations ("Stay organized", "Be careful", "Plan ahead", "Communicate well").
- Boilerplate filler that applies to any topic — only include steps specific to THIS goal.
- Items that require professional equipment or certification the user almost certainly doesn't have, unless the goal explicitly involves that profession.
- Two items that are the same step phrased differently.
- Steps the user has no authority or ability to control.

## Structure

- Group items into categories that reflect logical phases or themes of the work, not arbitrary headings.
- If parts of the goal repeat on a cadence, put recurring items in dedicated categories labeled with the cadence ("Daily checks", "Weekly maintenance", "Monthly review").
- Item and category counts are dictated by the topic. Include exactly what is needed for thorough coverage — no padding to look complete, no shrinking to look concise.
- Order items within a category in the sequence the user should perform them.

## The "description" field

Each "description" explains *how* to perform the step concretely: where to find the thing, what tool to use, what to look for, what the expected result looks like, and how the user knows the step is done. Treat the user as a first-timer. If the "text" is genuinely self-explanatory, description may be an empty string — but prefer adding helpful guidance.

## Self-review before responding

Re-read your draft. For every item, ask: "If a stranger received this checklist with no other context, would they know exactly what to do, and could they look at their work and decide for themselves whether the step is complete?"

If the answer is no, rewrite the item or remove it. Do NOT keep an item just to make the list look fuller.

Respond ONLY with a valid JSON code block using this exact schema — no explanation outside the block:

\`\`\`json
{
  "title": "string",
  "description": "string",
  "categories": [
    {
      "name": "string",
      "items": [
        { "text": "string", "description": "string", "imageLinks": ["https://example.com/image.jpg"] }
      ]
    }
  ]
}
\`\`\`

Rules:
- All text must be in ${languageName}.
- Each item's "description" must explain specifically how to complete that step.
- "description" fields may be empty strings but must be present.
- "imageLinks": optional array of up to 3 direct image URLs per item (diagrams, illustrations, reference photos). Only include URLs from well-known public sources such as wikimedia.org, commons.wikimedia.org, or official documentation/standards sites. If you are not certain a URL is real and publicly accessible, omit the field entirely.`;

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
      imageLinks: Array.isArray(item.imageLinks)
        ? item.imageLinks.filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
        : undefined,
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
