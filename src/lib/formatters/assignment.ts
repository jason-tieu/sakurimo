/**
 * Assignment parsing and display helpers (shared)
 */

const PREVIEW_MAX_LEN = 120;

/**
 * Strip HTML and return a short plain-text preview.
 */
export function stripHtmlToText(descriptionHtml: string | null | undefined): string {
  if (descriptionHtml == null || descriptionHtml === '') return 'N/A';
  const stripped = descriptionHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return 'N/A';
  if (stripped.length <= PREVIEW_MAX_LEN) return stripped;
  return stripped.slice(0, PREVIEW_MAX_LEN).trim() + '…';
}

/**
 * Format due_at for display: "15 Mar 2024, 11:59 pm"
 */
export function formatDueDate(dueAt: string | null | undefined): string {
  if (dueAt == null || dueAt === '') return 'N/A';
  try {
    const d = new Date(dueAt);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return 'N/A';
  }
}

const EXAM_KEYWORDS = /\b(exam|midsem|mid-sem|test)\b/i;
const FINAL_KEYWORDS = /\b(final)\b/i;

/**
 * Returns "final" | "exam" | null based on title and group name keywords.
 */
export function keywordLabel(
  title: string | null | undefined,
  groupName: string | null | undefined
): 'final' | 'exam' | null {
  const text = [title ?? '', groupName ?? ''].join(' ').trim();
  if (!text) return null;
  if (FINAL_KEYWORDS.test(text)) return 'final';
  if (EXAM_KEYWORDS.test(text)) return 'exam';
  return null;
}
