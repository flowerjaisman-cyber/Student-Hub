/**
 * Pure, deterministic text processing and academic writing utilities for StudentHub (Phase 6).
 * All calculations and transformations run 100% locally in the client browser.
 * Zero fake AI, zero fake grammar scores, zero fabricated references.
 */

import {
  CitationSource,
  CitationStyle,
  ReadabilityMetrics,
} from '../types/index.ts';

// -------------------------------------------------------------
// 1. Language, Script & Text Direction Detection
// -------------------------------------------------------------

/**
 * Detects if the given text has predominant Right-to-Left (RTL) characters
 * such as Urdu, Arabic, Persian, or Hebrew.
 */
export function detectRTL(text: string): boolean {
  if (!text) return false;
  // Arabic/Urdu Unicode blocks: 0600-06FF, 0750-077F, FB50-FDFF, FE70-FEFF
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/g;
  const matches = text.match(rtlRegex);
  if (!matches) return false;
  // If at least 25% of alphabetic characters are RTL, consider it RTL
  const alphaChars = text.replace(/[\s\d\p{P}]/gu, '');
  return alphaChars.length > 0 && matches.length / alphaChars.length > 0.25;
}

/**
 * Detects script category for language-aware operations.
 */
export function detectScriptCategory(text: string): 'Latin' | 'Urdu/Arabic' | 'Mixed/Other' {
  if (!text.trim()) return 'Latin';
  const hasRtl = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(text);
  const hasLatin = /[a-zA-Z]/u.test(text);

  if (hasRtl && hasLatin) return 'Mixed/Other';
  if (hasRtl) return 'Urdu/Arabic';
  return 'Latin';
}

// -------------------------------------------------------------
// 2. Text Formatter
// -------------------------------------------------------------

export interface TextFormatterOptions {
  trimLeadingTrailing?: boolean;
  normalizeMultipleSpaces?: boolean;
  normalizeLineBreaks?: boolean;
  trimEmptyLines?: boolean;
  addBlankLinesBetweenParagraphs?: boolean;
  removeBlankLines?: boolean;
  joinLines?: boolean;
  wrapText?: boolean;
  wrapColumn?: number;
  tabsToSpaces?: boolean;
  tabSpacesCount?: number;
  removeTabs?: boolean;
  convertRepeatedPunctuation?: boolean;
}

export function formatText(input: string, options: TextFormatterOptions): string {
  if (!input) return '';
  let result = input;

  // 1. Normalize line breaks to standard \n
  if (options.normalizeLineBreaks !== false) {
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // 2. Tabs handling
  if (options.removeTabs) {
    result = result.replace(/\t/g, '');
  } else if (options.tabsToSpaces) {
    const spaces = ' '.repeat(options.tabSpacesCount || 4);
    result = result.replace(/\t/g, spaces);
  }

  // 3. Trim empty lines / remove blank lines
  if (options.removeBlankLines) {
    result = result
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  // 4. Normalize multiple spaces
  if (options.normalizeMultipleSpaces) {
    result = result.replace(/[^\S\r\n]{2,}/g, ' ');
  }

  // 5. Trim leading / trailing spaces per line
  if (options.trimLeadingTrailing) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  // 6. Join lines into single continuous flow
  if (options.joinLines) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(' ');
  }

  // 7. Add blank lines between paragraphs
  if (options.addBlankLinesBetweenParagraphs) {
    const lines = result.split('\n');
    const spaced: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      spaced.push(lines[i]);
      if (i < lines.length - 1 && lines[i].trim() !== '' && lines[i + 1].trim() !== '') {
        spaced.push('');
      }
    }
    result = spaced.join('\n');
  }

  // 8. Convert repeated punctuation (e.g. ??? -> ?, !!! -> !, .... -> ...)
  if (options.convertRepeatedPunctuation) {
    result = result
      .replace(/\?{2,}/g, '?')
      .replace(/!{2,}/g, '!')
      .replace(/\.{4,}/g, '...');
  }

  // 9. Wrap text at specific column width
  if (options.wrapText && options.wrapColumn && options.wrapColumn > 10) {
    const maxCol = options.wrapColumn;
    const lines = result.split('\n');
    const wrappedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= maxCol) {
        wrappedLines.push(line);
        continue;
      }

      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        if (!currentLine) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= maxCol) {
          currentLine += ' ' + word;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }
    result = wrappedLines.join('\n');
  }

  return result;
}

// -------------------------------------------------------------
// 3. Case Converter
// -------------------------------------------------------------

export type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'sentence'
  | 'title'
  | 'capitalize-words'
  | 'alternating'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab';

// Common minor words to keep lowercase in Title Case (unless first or last word)
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to',
  'from', 'by', 'in', 'of', 'off', 'out', 'up', 'as', 'into', 'with'
]);

// Common academic acronyms
const COMMON_ACRONYMS = new Set([
  'NASA', 'DNA', 'RNA', 'USA', 'UK', 'EU', 'UN', 'UNESCO', 'WHO', 'AI', 'ML',
  'IEEE', 'ACM', 'HTML', 'CSS', 'JS', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON',
  'XML', 'PDF', 'CPU', 'GPU', 'RAM', 'ROM', 'SQL', 'MIT', 'GPA', 'CGPA', 'PhD', 'MSc', 'BSc'
]);

export function convertCase(
  input: string,
  caseType: CaseType,
  options?: { preserveAcronyms?: boolean }
): string {
  if (!input) return '';

  const preserveAcronyms = options?.preserveAcronyms ?? false;

  // Protect URLs and emails by tokenizing
  const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
  const tokens: string[] = [];
  const placeholderPrefix = `__STUDENTHUB_TOKEN_`;

  let tokenized = input.replace(urlRegex, (matched) => {
    const idx = tokens.length;
    tokens.push(matched);
    return `${placeholderPrefix}${idx}__`;
  });

  // Protect acronyms if requested
  const acronymTokens: string[] = [];
  if (preserveAcronyms) {
    const acronymRegex = /\b([A-Z]{2,6})\b/g;
    tokenized = tokenized.replace(acronymRegex, (matched) => {
      if (COMMON_ACRONYMS.has(matched) || matched.length >= 2) {
        const idx = acronymTokens.length;
        acronymTokens.push(matched);
        return `__ACRONYM_${idx}__`;
      }
      return matched;
    });
  }

  let transformed = '';

  switch (caseType) {
    case 'uppercase':
      transformed = tokenized.toUpperCase();
      break;

    case 'lowercase':
      transformed = tokenized.toLowerCase();
      break;

    case 'sentence': {
      // Lowercase everything, then capitalize start of sentences
      const lower = tokenized.toLowerCase();
      transformed = lower.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, prefix, char) => {
        return prefix + char.toUpperCase();
      });
      break;
    }

    case 'title': {
      const lines = tokenized.split('\n');
      const titleLines = lines.map((line) => {
        const words = line.split(/(\s+)/);
        const wordTokens = words.filter((w) => !/^\s+$/.test(w) && w.length > 0);
        const firstWord = wordTokens[0] || '';
        const lastWord = wordTokens[wordTokens.length - 1] || '';

        return words
          .map((word) => {
            if (/^\s+$/.test(word) || !word) return word;
            const lowerWord = word.toLowerCase();
            const cleanWord = lowerWord.replace(/[^\p{L}\p{N}]/gu, '');

            if (
              word !== firstWord &&
              word !== lastWord &&
              TITLE_CASE_MINOR_WORDS.has(cleanWord)
            ) {
              return lowerWord;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join('');
      });
      transformed = titleLines.join('\n');
      break;
    }

    case 'capitalize-words': {
      transformed = tokenized.replace(/\b(\p{L})/gu, (char) => char.toUpperCase());
      break;
    }

    case 'alternating': {
      let upper = false;
      transformed = tokenized
        .split('')
        .map((char) => {
          if (/\p{L}/u.test(char)) {
            upper = !upper;
            return upper ? char.toUpperCase() : char.toLowerCase();
          }
          return char;
        })
        .join('');
      break;
    }

    case 'camel': {
      const words = tokenized
        .replace(/[^\p{L}\p{N}\s_]/gu, ' ')
        .split(/[\s_-]+/)
        .filter((w) => w.length > 0);
      if (words.length === 0) return '';
      transformed =
        words[0].toLowerCase() +
        words
          .slice(1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('');
      break;
    }

    case 'pascal': {
      const words = tokenized
        .replace(/[^\p{L}\p{N}\s_]/gu, ' ')
        .split(/[\s_-]+/)
        .filter((w) => w.length > 0);
      transformed = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
      break;
    }

    case 'snake': {
      transformed = tokenized
        .replace(/[^\p{L}\p{N}]+/gu, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
      break;
    }

    case 'kebab': {
      transformed = tokenized
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      break;
    }
  }

  // Restore acronyms
  if (preserveAcronyms) {
    transformed = transformed.replace(/__ACRONYM_(\d+)__/g, (_, idx) => {
      return acronymTokens[parseInt(idx, 10)] || '';
    });
  }

  // Restore URLs and emails
  transformed = transformed.replace(new RegExp(`${placeholderPrefix}(\\d+)__`, 'g'), (_, idx) => {
    return tokens[parseInt(idx, 10)] || '';
  });

  return transformed;
}

// -------------------------------------------------------------
// 4. Text Cleaner
// -------------------------------------------------------------

export interface TextCleanerOptions {
  removeExtraSpaces: boolean;
  removeTrailingSpaces: boolean;
  normalizeQuotes: boolean;
  normalizeApostrophes: boolean;
  normalizeDashes: boolean;
  normalizeLineEndings: boolean;
  removeDuplicateBlankLines: boolean;
  removeControlChars: boolean;
  normalizeUnicodeWhitespace: boolean;
}

export interface CleanerStats {
  extraSpacesCleaned: number;
  trailingSpacesCleaned: number;
  quotesCleaned: number;
  apostrophesCleaned: number;
  dashesCleaned: number;
  controlCharsCleaned: number;
  blankLinesReduced: number;
  unicodeSpacesCleaned: number;
  totalChanges: number;
}

export function cleanText(
  input: string,
  options: TextCleanerOptions
): { cleaned: string; stats: CleanerStats } {
  if (!input) {
    return {
      cleaned: '',
      stats: {
        extraSpacesCleaned: 0,
        trailingSpacesCleaned: 0,
        quotesCleaned: 0,
        apostrophesCleaned: 0,
        dashesCleaned: 0,
        controlCharsCleaned: 0,
        blankLinesReduced: 0,
        unicodeSpacesCleaned: 0,
        totalChanges: 0,
      },
    };
  }

  let result = input;
  let extraSpacesCleaned = 0;
  let trailingSpacesCleaned = 0;
  let quotesCleaned = 0;
  let apostrophesCleaned = 0;
  let dashesCleaned = 0;
  let controlCharsCleaned = 0;
  let blankLinesReduced = 0;
  let unicodeSpacesCleaned = 0;

  // 1. Remove invisible control characters (zero-width spaces, null bytes, non-printables)
  if (options.removeControlChars) {
    const controlRegex = /[\u200B\u200C\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
    const matches = result.match(controlRegex);
    if (matches) controlCharsCleaned = matches.length;
    result = result.replace(controlRegex, '');
  }

  // 2. Normalize Unicode whitespace (non-breaking spaces, en-quad, em-quad -> standard space)
  if (options.normalizeUnicodeWhitespace) {
    const unicodeSpaceRegex = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
    const matches = result.match(unicodeSpaceRegex);
    if (matches) unicodeSpacesCleaned = matches.length;
    result = result.replace(unicodeSpaceRegex, ' ');
  }

  // 3. Normalize line endings
  if (options.normalizeLineEndings) {
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // 4. Normalize quotation marks (smart double quotes to standard straight ")
  if (options.normalizeQuotes) {
    const quoteRegex = /[“”„«»]/g;
    const matches = result.match(quoteRegex);
    if (matches) quotesCleaned = matches.length;
    result = result.replace(quoteRegex, '"');
  }

  // 5. Normalize apostrophes and smart single quotes
  if (options.normalizeApostrophes) {
    const apostropheRegex = /[‘’′`]/g;
    const matches = result.match(apostropheRegex);
    if (matches) apostrophesCleaned = matches.length;
    result = result.replace(apostropheRegex, "'");
  }

  // 6. Normalize dashes (em-dash, en-dash to standard hyphen or double hyphen)
  if (options.normalizeDashes) {
    const dashRegex = /[—–]/g;
    const matches = result.match(dashRegex);
    if (matches) dashesCleaned = matches.length;
    result = result.replace(dashRegex, '-');
  }

  // 7. Remove duplicate blank lines
  if (options.removeDuplicateBlankLines) {
    const blankLineRegex = /\n{3,}/g;
    const matches = result.match(blankLineRegex);
    if (matches) {
      matches.forEach((m) => {
        blankLinesReduced += m.length - 2;
      });
    }
    result = result.replace(blankLineRegex, '\n\n');
  }

  // 8. Remove trailing spaces per line
  if (options.removeTrailingSpaces) {
    const trailingRegex = /[^\S\r\n]+$/gm;
    const matches = result.match(trailingRegex);
    if (matches) trailingSpacesCleaned = matches.length;
    result = result.replace(trailingRegex, '');
  }

  // 9. Remove extra spaces
  if (options.removeExtraSpaces) {
    const extraSpaceRegex = /[^\S\r\n]{2,}/g;
    const matches = result.match(extraSpaceRegex);
    if (matches) extraSpacesCleaned = matches.length;
    result = result.replace(extraSpaceRegex, ' ');
  }

  const totalChanges =
    extraSpacesCleaned +
    trailingSpacesCleaned +
    quotesCleaned +
    apostrophesCleaned +
    dashesCleaned +
    controlCharsCleaned +
    blankLinesReduced +
    unicodeSpacesCleaned;

  return {
    cleaned: result,
    stats: {
      extraSpacesCleaned,
      trailingSpacesCleaned,
      quotesCleaned,
      apostrophesCleaned,
      dashesCleaned,
      controlCharsCleaned,
      blankLinesReduced,
      unicodeSpacesCleaned,
      totalChanges,
    },
  };
}

// -------------------------------------------------------------
// 5. Duplicate Line Remover
// -------------------------------------------------------------

export interface DuplicateLineOptions {
  caseInsensitive: boolean;
  trimWhitespace: boolean;
  preserveLast: boolean;
}

export function removeDuplicateLines(
  input: string,
  options: DuplicateLineOptions
): {
  output: string;
  originalLinesCount: number;
  duplicatesRemovedCount: number;
  finalLinesCount: number;
} {
  if (!input) {
    return {
      output: '',
      originalLinesCount: 0,
      duplicatesRemovedCount: 0,
      finalLinesCount: 0,
    };
  }

  const lines = input.split('\n');
  const originalLinesCount = lines.length;

  const normalizeKey = (line: string): string => {
    let key = line;
    if (options.trimWhitespace) key = key.trim();
    if (options.caseInsensitive) key = key.toLowerCase();
    return key;
  };

  const seen = new Set<string>();
  const outputLines: string[] = [];

  if (options.preserveLast) {
    // Process from bottom up
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const key = normalizeKey(line);
      if (!seen.has(key)) {
        seen.add(key);
        outputLines.unshift(line);
      }
    }
  } else {
    // Preserve first (default)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const key = normalizeKey(line);
      if (!seen.has(key)) {
        seen.add(key);
        outputLines.push(line);
      }
    }
  }

  const finalLinesCount = outputLines.length;
  const duplicatesRemovedCount = originalLinesCount - finalLinesCount;

  return {
    output: outputLines.join('\n'),
    originalLinesCount,
    duplicatesRemovedCount,
    finalLinesCount,
  };
}

// -------------------------------------------------------------
// 6. Find & Replace
// -------------------------------------------------------------

export interface FindReplaceOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

export function countMatches(
  text: string,
  searchTerm: string,
  options: FindReplaceOptions
): number {
  if (!text || !searchTerm) return 0;
  try {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = options.caseSensitive ? 'g' : 'gi';
    const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(pattern, flags);
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

export function performReplace(
  text: string,
  searchTerm: string,
  replacement: string,
  options: FindReplaceOptions,
  replaceAll: boolean
): { result: string; replacedCount: number } {
  if (!text || !searchTerm) return { result: text, replacedCount: 0 };

  try {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = replaceAll ? (options.caseSensitive ? 'g' : 'gi') : options.caseSensitive ? '' : 'i';
    const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(pattern, flags);

    let count = 0;
    if (replaceAll) {
      const matches = text.match(regex);
      count = matches ? matches.length : 0;
      return { result: text.replace(regex, replacement), replacedCount: count };
    } else {
      const hasMatch = regex.test(text);
      if (hasMatch) {
        return { result: text.replace(regex, replacement), replacedCount: 1 };
      }
      return { result: text, replacedCount: 0 };
    }
  } catch {
    return { result: text, replacedCount: 0 };
  }
}

// -------------------------------------------------------------
// 7. Text Compare (Diff)
// -------------------------------------------------------------

export type DiffType = 'unchanged' | 'added' | 'removed';

export interface DiffPart {
  type: DiffType;
  value: string;
}

export interface TextCompareResult {
  isIdentical: boolean;
  linesAdded: number;
  linesRemoved: number;
  linesUnchanged: number;
  lineDiffs: DiffPart[];
  wordDiffs: DiffPart[];
}

export function compareTexts(original: string, modified: string): TextCompareResult {
  const isIdentical = original === modified;

  // Simple line-level LCS diff
  const origLines = original ? original.split('\n') : [];
  const modLines = modified ? modified.split('\n') : [];

  const lineDiffs: DiffPart[] = [];
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesUnchanged = 0;

  // Simple diff algorithm using greedy lookahead
  let oIdx = 0;
  let mIdx = 0;

  while (oIdx < origLines.length || mIdx < modLines.length) {
    if (oIdx >= origLines.length) {
      lineDiffs.push({ type: 'added', value: modLines[mIdx] });
      linesAdded++;
      mIdx++;
    } else if (mIdx >= modLines.length) {
      lineDiffs.push({ type: 'removed', value: origLines[oIdx] });
      linesRemoved++;
      oIdx++;
    } else if (origLines[oIdx] === modLines[mIdx]) {
      lineDiffs.push({ type: 'unchanged', value: origLines[oIdx] });
      linesUnchanged++;
      oIdx++;
      mIdx++;
    } else {
      // Look ahead to check if line was removed or added
      const nextMatchInMod = modLines.indexOf(origLines[oIdx], mIdx);
      const nextMatchInOrig = origLines.indexOf(modLines[mIdx], oIdx);

      if (nextMatchInMod !== -1 && (nextMatchInOrig === -1 || nextMatchInMod - mIdx <= nextMatchInOrig - oIdx)) {
        // Line added in modified
        lineDiffs.push({ type: 'added', value: modLines[mIdx] });
        linesAdded++;
        mIdx++;
      } else {
        // Line removed from original
        lineDiffs.push({ type: 'removed', value: origLines[oIdx] });
        linesRemoved++;
        oIdx++;
      }
    }
  }

  // Word-level diff
  const origWords = original ? original.split(/(\s+)/) : [];
  const modWords = modified ? modified.split(/(\s+)/) : [];
  const wordDiffs: DiffPart[] = [];

  let owIdx = 0;
  let mwIdx = 0;

  while (owIdx < origWords.length || mwIdx < modWords.length) {
    if (owIdx >= origWords.length) {
      wordDiffs.push({ type: 'added', value: modWords[mwIdx] });
      mwIdx++;
    } else if (mwIdx >= modWords.length) {
      wordDiffs.push({ type: 'removed', value: origWords[owIdx] });
      owIdx++;
    } else if (origWords[owIdx] === modWords[mwIdx]) {
      wordDiffs.push({ type: 'unchanged', value: origWords[owIdx] });
      owIdx++;
      mwIdx++;
    } else {
      wordDiffs.push({ type: 'removed', value: origWords[owIdx] });
      wordDiffs.push({ type: 'added', value: modWords[mwIdx] });
      owIdx++;
      mwIdx++;
    }
  }

  return {
    isIdentical,
    linesAdded,
    linesRemoved,
    linesUnchanged,
    lineDiffs,
    wordDiffs,
  };
}

// -------------------------------------------------------------
// 8. Readability Checker (Calculated Statistical Metrics)
// -------------------------------------------------------------

/**
 * Approximate syllable counter for English words.
 */
function countSyllablesInWord(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length <= 1) return 1;
  if (clean.length <= 3) return 1;

  // Count vowel sequences
  const vowelMatches = clean.match(/[aeiouy]+/g);
  let syllables = vowelMatches ? vowelMatches.length : 1;

  // Subtract silent 'e' at end
  if (clean.endsWith('e') && !clean.endsWith('le') && syllables > 1) {
    syllables--;
  }
  // Subtract -ed or -es endings if not preceded by t or d
  if ((clean.endsWith('ed') || clean.endsWith('es')) && syllables > 1) {
    const prev = clean.charAt(clean.length - 3);
    if (prev !== 't' && prev !== 'd') {
      syllables--;
    }
  }

  return Math.max(1, syllables);
}

export function calculateReadability(text: string): ReadabilityMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgWordsPerSentence: 0,
      avgCharsPerWord: 0,
      readingTimeMinutes: 0,
      isEnglishOrLatin: true,
      detectedScript: 'Latin',
    };
  }

  // Detect script
  const detectedScript = detectScriptCategory(trimmed);
  const isEnglishOrLatin = detectedScript === 'Latin';

  // Words count
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Sentences count
  // Avoid false splits on abbreviations like Dr., Prof., e.g., i.e., vs.
  const sentenceDelim = /([.!?]+)(?=\s+[\p{Lu}\p{Lt}]|$)/gu;
  const sentences = trimmed.split(sentenceDelim).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, Math.floor(sentences.length / 2) || (trimmed.length > 0 ? 1 : 0));

  // Paragraphs count
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  // Averages
  const avgWordsPerSentence = Number((wordCount / sentenceCount).toFixed(1));
  const totalCharsNoSpace = words.reduce((acc, w) => acc + w.length, 0);
  const avgCharsPerWord = wordCount > 0 ? Number((totalCharsNoSpace / wordCount).toFixed(1)) : 0;

  // Estimated reading time (~210 words per minute standard academic rate)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 210));

  let fleschReadingEase: number | undefined;
  let fleschKincaidGrade: number | undefined;

  // Only calculate English-specific formulas when text is Latin/English!
  if (isEnglishOrLatin && wordCount >= 5 && sentenceCount >= 1) {
    let totalSyllables = 0;
    for (const w of words) {
      totalSyllables += countSyllablesInWord(w);
    }
    const syllablesPerWord = totalSyllables / wordCount;
    const wordsPerSentence = wordCount / sentenceCount;

    // Flesch Reading Ease Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const ease = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
    fleschReadingEase = Number(Math.max(0, Math.min(100, ease)).toFixed(1));

    // Flesch-Kincaid Grade Level Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    fleschKincaidGrade = Number(Math.max(1, Math.min(18, grade)).toFixed(1));
  }

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgCharsPerWord,
    readingTimeMinutes,
    fleschReadingEase,
    fleschKincaidGrade,
    isEnglishOrLatin,
    detectedScript,
  };
}

// -------------------------------------------------------------
// 9. Sentence & Paragraph Tools
// -------------------------------------------------------------

export function splitTextIntoSentences(text: string): string[] {
  if (!text) return [];
  // Tokenize common abbreviations
  const abbrList = ['dr.', 'mr.', 'ms.', 'mrs.', 'prof.', 'vs.', 'e.g.', 'i.e.', 'etc.', 'fig.', 'al.', 'dept.', 'est.', 'inc.'];
  let processed = text;
  abbrList.forEach((abbr, idx) => {
    const reg = new RegExp(`\\b${abbr.replace('.', '\\.')}`, 'gi');
    processed = processed.replace(reg, `__ABBR_${idx}__`);
  });

  // Split on sentence boundaries
  const rawSentences = processed.split(/(?<=[.!?])\s+(?=[A-Z\u0600-\u06FF0-9])/);

  return rawSentences
    .map((s) => {
      let restored = s;
      abbrList.forEach((abbr, idx) => {
        restored = restored.replace(new RegExp(`__ABBR_${idx}__`, 'g'), abbr);
      });
      return restored.trim();
    })
    .filter((s) => s.length > 0);
}

export function oneSentencePerLine(text: string): string {
  const sentences = splitTextIntoSentences(text);
  return sentences.join('\n');
}

export function combineShortLinesIntoParagraphs(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const result: string[] = [];
  let currentPara: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentPara.length > 0) {
        result.push(currentPara.join(' '));
        currentPara = [];
      }
      result.push('');
    } else {
      currentPara.push(trimmed);
      // If line ends with period/question/exclamation, or blank line follows, flush
      if (/[.!?]$/.test(trimmed)) {
        result.push(currentPara.join(' '));
        currentPara = [];
      }
    }
  }

  if (currentPara.length > 0) {
    result.push(currentPara.join(' '));
  }

  return result.join('\n');
}

export function capitalizeFirstLetterOfSentences(text: string): string {
  if (!text) return '';
  return text.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

// -------------------------------------------------------------
// 10. List & Numbering Tools
// -------------------------------------------------------------

export type NumberingStyle = '123' | '0102' | 'ABC' | 'abc' | 'roman';
export type BulletStyle = '•' | '-' | '*' | '▸' | 'custom';

function toRoman(num: number): string {
  const lookup: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let roman = '';
  let n = num;
  for (const [val, letter] of lookup) {
    while (n >= val) {
      roman += letter;
      n -= val;
    }
  }
  return roman || 'I';
}

function getNumberPrefix(index: number, style: NumberingStyle): string {
  const num = index + 1;
  switch (style) {
    case '0102':
      return `${String(num).padStart(2, '0')}. `;
    case 'ABC':
      return `${String.fromCharCode(65 + ((num - 1) % 26))}. `;
    case 'abc':
      return `${String.fromCharCode(97 + ((num - 1) % 26))}. `;
    case 'roman':
      return `${toRoman(num)}. `;
    case '123':
    default:
      return `${num}. `;
  }
}

export function applyListNumbering(
  input: string,
  action: 'numbered' | 'bullet' | 'remove-numbering' | 'remove-bullets' | 'renumber' | 'alphabetize-asc' | 'alphabetize-desc' | 'reverse',
  options?: {
    numStyle?: NumberingStyle;
    bulletStyle?: BulletStyle;
    customBullet?: string;
  }
): string {
  if (!input) return '';
  const lines = input.split('\n');
  const numStyle = options?.numStyle || '123';
  const bulletChar =
    options?.bulletStyle === 'custom'
      ? options?.customBullet || '•'
      : options?.bulletStyle || '•';

  // Helper to strip existing numbering or bullet prefixes
  const stripPrefixes = (line: string): string => {
    return line
      .replace(/^(\d+\.|\d+\)|\(\d+\)|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\.)\s+/, '')
      .replace(/^[•\-\*▸–—\+]\s+/, '');
  };

  switch (action) {
    case 'remove-numbering':
      return lines
        .map((line) => line.replace(/^(\d+\.|\d+\)|\(\d+\)|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\.)\s+/, ''))
        .join('\n');

    case 'remove-bullets':
      return lines
        .map((line) => line.replace(/^[•\-\*▸–—\+]\s+/, ''))
        .join('\n');

    case 'numbered': {
      let counter = 0;
      return lines
        .map((line) => {
          if (!line.trim()) return line;
          const clean = stripPrefixes(line);
          const prefix = getNumberPrefix(counter++, numStyle);
          return prefix + clean;
        })
        .join('\n');
    }

    case 'bullet': {
      return lines
        .map((line) => {
          if (!line.trim()) return line;
          const clean = stripPrefixes(line);
          return `${bulletChar} ${clean}`;
        })
        .join('\n');
    }

    case 'renumber': {
      let counter = 0;
      return lines
        .map((line) => {
          if (!line.trim()) return line;
          const clean = stripPrefixes(line);
          const prefix = getNumberPrefix(counter++, numStyle);
          return prefix + clean;
        })
        .join('\n');
    }

    case 'alphabetize-asc': {
      const nonEmpties = lines.filter((l) => l.trim().length > 0);
      nonEmpties.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      return nonEmpties.join('\n');
    }

    case 'alphabetize-desc': {
      const nonEmpties = lines.filter((l) => l.trim().length > 0);
      nonEmpties.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
      return nonEmpties.join('\n');
    }

    case 'reverse': {
      return [...lines].reverse().join('\n');
    }
  }
}

// -------------------------------------------------------------
// 11. Citation Formatter & Bibliography Engine
// -------------------------------------------------------------

/**
 * Sanitizes URLs to ensure only safe http/https web links are accepted.
 */
export function sanitizeWebUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export interface CitationResult {
  formattedText: string;
  missingFields: string[];
}

export function formatCitation(
  source: CitationSource,
  style: CitationStyle
): CitationResult {
  const missing: string[] = [];

  const authors = source.authors ? source.authors.trim() : '';
  const title = source.title ? source.title.trim() : '';
  const pubTitle = source.publicationTitle ? source.publicationTitle.trim() : '';
  const publisher = source.publisher ? source.publisher.trim() : '';
  const year = source.year ? source.year.trim() : '';
  const volume = source.volume ? source.volume.trim() : '';
  const issue = source.issue ? source.issue.trim() : '';
  const pages = source.pages ? source.pages.trim() : '';
  const safeUrl = sanitizeWebUrl(source.url);
  const doi = source.doi ? source.doi.trim() : '';
  const accessDate = source.accessDate ? source.accessDate.trim() : '';

  if (!authors) missing.push('Author(s)');
  if (!title) missing.push('Title');
  if (!year) missing.push('Publication year');

  let formatted = '';

  switch (style) {
    case 'apa7': {
      // Author, A. A. (Year). Title of article. Publication Title, Volume(Issue), pages. DOI/URL
      const authorPart = authors || '[Author unknown]';
      const yearPart = year ? `(${year})` : '(n.d.)';
      const titlePart = title ? `${title}.` : '[Untitled work].';
      let publicationPart = '';

      if (pubTitle) {
        publicationPart = pubTitle;
        if (volume) publicationPart += `, ${volume}`;
        if (issue) publicationPart += `(${issue})`;
        if (pages) publicationPart += `, ${pages}`;
        publicationPart += '.';
      } else if (publisher) {
        publicationPart = `${publisher}.`;
      }

      const linkPart = doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, '')}` : safeUrl || '';

      formatted = [authorPart, yearPart, titlePart, publicationPart, linkPart]
        .filter(Boolean)
        .join(' ');
      break;
    }

    case 'mla9': {
      // Author. "Title of Article." Publication Title, vol. X, no. Y, Year, pp. pages. URL.
      const authorPart = authors ? `${authors}.` : '[Author unknown].';
      const titlePart = title ? `"${title}."` : '["Untitled work"].';
      let containerPart = '';

      if (pubTitle) {
        containerPart = pubTitle;
        if (volume) containerPart += `, vol. ${volume}`;
        if (issue) containerPart += `, no. ${issue}`;
        if (publisher && !pubTitle) containerPart += `, ${publisher}`;
        if (year) containerPart += `, ${year}`;
        if (pages) containerPart += `, pp. ${pages}`;
        containerPart += '.';
      } else if (year) {
        containerPart = `${year}.`;
      }

      const linkPart = safeUrl ? `${safeUrl}.` : doi ? `doi:${doi}.` : '';

      formatted = [authorPart, titlePart, containerPart, linkPart]
        .filter(Boolean)
        .join(' ');
      break;
    }

    case 'chicago': {
      // Author. "Title." Publication Title volume, no. issue (Year): pages. URL.
      const authorPart = authors ? `${authors}.` : '[Author unknown].';
      const titlePart = title ? `"${title}."` : '["Untitled work"].';
      let pubPart = '';

      if (pubTitle) {
        pubPart = pubTitle;
        if (volume) pubPart += ` ${volume}`;
        if (issue) pubPart += `, no. ${issue}`;
        if (year) pubPart += ` (${year})`;
        if (pages) pubPart += `: ${pages}`;
        pubPart += '.';
      } else if (publisher) {
        pubPart = `${publisher}, ${year || 'n.d.'}.`;
      }

      const linkPart = safeUrl || (doi ? `https://doi.org/${doi}` : '');

      formatted = [authorPart, titlePart, pubPart, linkPart]
        .filter(Boolean)
        .join(' ');
      break;
    }

    case 'harvard': {
      // Author (Year) 'Title', Publication Title, Volume(Issue), pp. pages. Available at: URL (Accessed: date).
      const authorPart = authors || '[Author unknown]';
      const yearPart = year ? `(${year})` : '(no date)';
      const titlePart = title ? `'${title}',` : "'[Untitled work]',";
      let pubPart = '';

      if (pubTitle) {
        pubPart = pubTitle;
        if (volume) pubPart += `, ${volume}`;
        if (issue) pubPart += `(${issue})`;
        if (pages) pubPart += `, pp. ${pages}`;
        pubPart += '.';
      } else if (publisher) {
        pubPart = `${publisher}.`;
      }

      let linkPart = '';
      if (safeUrl) {
        linkPart = `Available at: ${safeUrl}`;
        if (accessDate) linkPart += ` (Accessed: ${accessDate})`;
        linkPart += '.';
      }

      formatted = [authorPart, yearPart, titlePart, pubPart, linkPart]
        .filter(Boolean)
        .join(' ');
      break;
    }
  }

  return {
    formattedText: formatted,
    missingFields: missing,
  };
}

// -------------------------------------------------------------
// 12. Clipboard & File Export Utilities
// -------------------------------------------------------------

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
