const ISO_DATE_PATTERN =
  /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/g;

export interface FormatDateOptions {
  includeTime?: boolean;
  fallback?: string;
}

export function formatDate(
  value: string | Date | null | undefined,
  opts: FormatDateOptions = {},
): string {
  const { includeTime = false, fallback = "—" } = opts;
  if (!value) return fallback;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : fallback;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function humanizeDatesInText(text: string | null | undefined): string {
  if (!text) return text ?? "";
  return text.replace(ISO_DATE_PATTERN, (match) => formatDate(match));
}
