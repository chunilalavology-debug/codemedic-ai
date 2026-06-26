export type ModelProvider = "groq";

export interface AiModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  type: "text" | "vision";
  description: string;
  dailyLimit?: string;
}

export const TEXT_MODELS: AiModelOption[] = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    type: "text",
    description: "Best balance of speed and quality for code analysis",
    dailyLimit: "14,400 req/day",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    provider: "groq",
    type: "text",
    description: "Fastest responses for quick scans",
    dailyLimit: "14,400 req/day",
  },
];

export const VISION_MODELS: AiModelOption[] = [
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    label: "Llama 4 Scout",
    provider: "groq",
    type: "vision",
    description: "Vision model for image-to-code",
    dailyLimit: "14,400 req/day",
  },
];

export const DEFAULT_TEXT_MODEL = TEXT_MODELS[0].id;
export const DEFAULT_VISION_MODEL = VISION_MODELS[0].id;

export function resolveTextModel(preferred?: string | null): string {
  if (preferred && TEXT_MODELS.some((m) => m.id === preferred)) return preferred;
  return DEFAULT_TEXT_MODEL;
}

export function resolveVisionModel(preferred?: string | null): string {
  if (preferred && VISION_MODELS.some((m) => m.id === preferred)) return preferred;
  return DEFAULT_VISION_MODEL;
}

export function getModelLabel(id: string): string {
  return (
    TEXT_MODELS.find((m) => m.id === id)?.label ??
    VISION_MODELS.find((m) => m.id === id)?.label ??
    id
  );
}
