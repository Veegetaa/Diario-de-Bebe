import { NoteRecord } from './types';

/**
 * Normalizes string removing accents and converting to lowercase
 * e.g., "Cólica" -> "colica"
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks if note content matches all search terms (prefixes or full words, accent-insensitive)
 */
export function matchesSearchTerms(text: string, query: string): boolean {
  if (!query.trim()) return true;

  const normalizedText = normalizeString(text);
  const wordsInText = normalizedText.split(/\s+/);
  const searchTerms = normalizeString(query).split(/\s+/).filter(Boolean);

  // Every search term must match as a prefix or substring in at least one word
  return searchTerms.every((term) => {
    return wordsInText.some((w) => w.includes(term));
  });
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export interface HighlightedSnippetData {
  prefixEllipsis: string;
  segments: HighlightSegment[];
  suffixEllipsis: string;
}

/**
 * Extracts a snippet and breaks text into matching/non-matching segments for display.
 * Preserves the original casing and accents of the original text.
 */
export function getHighlightedSnippetData(
  content: string,
  query: string,
  maxLength = 140
): HighlightedSnippetData {
  if (!query.trim()) {
    const isTruncated = content.length > maxLength;
    const displayText = isTruncated ? content.slice(0, maxLength) : content;
    return {
      prefixEllipsis: '',
      segments: [{ text: displayText, isMatch: false }],
      suffixEllipsis: isTruncated ? '…' : '',
    };
  }

  const normalizedContent = normalizeString(content);
  const terms = normalizeString(query).split(/\s+/).filter(Boolean);

  // Find earliest match index in normalized content
  let earliestIdx = -1;
  terms.forEach((term) => {
    const idx = normalizedContent.indexOf(term);
    if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
      earliestIdx = idx;
    }
  });

  // Determine window for snippet
  let start = 0;
  let end = content.length;

  if (content.length > maxLength) {
    if (earliestIdx > 30) {
      start = Math.max(0, earliestIdx - 30);
      end = Math.min(content.length, start + maxLength);
    } else {
      start = 0;
      end = maxLength;
    }
  }

  const snippetRaw = content.slice(start, end);
  const prefixEllipsis = start > 0 ? '… ' : '';
  const suffixEllipsis = end < content.length ? ' …' : '';

  // Build regex matching any search term variations for accents
  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escapedTerms
    .map((term) => {
      return term
        .split('')
        .map((char) => {
          switch (char) {
            case 'a':
              return '[aáàãâä]';
            case 'e':
              return '[eéèêë]';
            case 'i':
              return '[iíìîï]';
            case 'o':
              return '[oóòõôö]';
            case 'u':
              return '[uúùûü]';
            case 'c':
              return '[cç]';
            default:
              return char;
          }
        })
        .join('');
    })
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = snippetRaw.split(regex);

  const segments: HighlightSegment[] = parts
    .filter((p) => p.length > 0)
    .map((part) => {
      const isMatch = regex.test(part);
      // Reset regex state after test with global flag
      regex.lastIndex = 0;
      return {
        text: part,
        isMatch,
      };
    });

  return {
    prefixEllipsis,
    segments,
    suffixEllipsis,
  };
}
