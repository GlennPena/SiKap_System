import { NormalizedInput, NormalizedInputs, NormalizedGoal } from "../types";
import { INITIAL_ALIASES, StaticAlias } from "./cbf-taxonomy-data";

/**
 * Default Levenshtein similarity threshold for fuzzy matching
 */
export const DEFAULT_FUZZY_SIMILARITY_THRESHOLD = 0.82;

/**
 * Cleans natural text: lowercases, removes excess punctuation, and normalizes spaces
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // remove punctuation except hyphens
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Levenshtein Distance similarity score between 0.0 and 1.0
 */
export function calculateLevenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const aLen = a.length;
  const bLen = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLen = Math.max(aLen, bLen);
  return 1.0 - matrix[bLen][aLen] / maxLen;
}

/**
 * Normalizes a single raw text input through the locked CBF pipeline:
 * Clean -> Phrase Extraction -> Longest Alias Match -> Exact Match -> Fuzzy Match -> Ambiguity Check -> Resolved/Unresolved
 */
export function normalizeSingleInput(
  rawInput: string,
  aliases: StaticAlias[] = INITIAL_ALIASES,
  fuzzyThreshold: number = DEFAULT_FUZZY_SIMILARITY_THRESHOLD
): NormalizedInput {
  const originalRaw = typeof rawInput === "string" ? rawInput.trim() : "";
  if (!originalRaw) {
    return {
      raw: originalRaw,
      value: null,
      categoryId: null,
      isUnresolved: true
    };
  }

  const cleaned = cleanText(originalRaw);
  if (!cleaned) {
    return {
      raw: originalRaw,
      value: null,
      categoryId: null,
      isUnresolved: true
    };
  }

  // 1. Sort aliases by length descending to guarantee longest/most specific phrase matches first
  const sortedAliases = [...aliases].sort((a, b) => b.alias.length - a.alias.length);

  // Group aliases by alias string for ambiguity check
  const aliasGroups = new Map<string, StaticAlias[]>();
  for (const item of sortedAliases) {
    const key = item.alias.toLowerCase().trim();
    const existing = aliasGroups.get(key) || [];
    existing.push(item);
    aliasGroups.set(key, existing);
  }

  // 2. Exact Full-String Match
  const directMatches = aliasGroups.get(cleaned);
  if (directMatches && directMatches.length > 0) {
    // Check for ambiguity across distinct categories
    const uniqueCategoryIds = new Set(directMatches.map(m => m.categoryId));
    if (uniqueCategoryIds.size > 1) {
      return {
        raw: originalRaw,
        value: null,
        categoryId: null,
        isUnresolved: true
      };
    }
    return {
      raw: originalRaw,
      value: directMatches[0].normalizedValue,
      categoryId: directMatches[0].categoryId,
      isUnresolved: false
    };
  }

  // 3. Phrase Extraction & Substring Matching (Longest specific phrase first)
  // Check if any multi-word or single-word alias appears as a distinct word boundary phrase in the sentence
  for (const [aliasKey, group] of aliasGroups.entries()) {
    // Word-boundary check: regex \b<alias>\b
    const escapedAlias = aliasKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escapedAlias}(\\s|$)`, "i");
    if (regex.test(cleaned)) {
      const uniqueCategoryIds = new Set(group.map(m => m.categoryId));
      if (uniqueCategoryIds.size > 1) {
        return {
          raw: originalRaw,
          value: null,
          categoryId: null,
          isUnresolved: true
        };
      }
      return {
        raw: originalRaw,
        value: group[0].normalizedValue,
        categoryId: group[0].categoryId,
        isUnresolved: false
      };
    }
  }

  // 4. Fuzzy Matching on Sentence Tokens & Multi-word Windows
  // Extract 1-word, 2-word, and 3-word n-grams from the cleaned sentence
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  const candidateNgrams: string[] = [];

  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(" ");
      candidateNgrams.push(ngram);
    }
  }

  let bestFuzzyMatch: { alias: StaticAlias; similarity: number } | null = null;
  const matchingCategoriesAtTopSim = new Set<string>();

  for (const ngram of candidateNgrams) {
    if (ngram.length < 4) continue; // safety rule: ignore short noise words for fuzzy matching

    for (const item of sortedAliases) {
      const aliasKey = item.alias.toLowerCase().trim();
      // Length differential check: only fuzzy match if lengths are reasonably close
      if (Math.abs(aliasKey.length - ngram.length) > 3) continue;

      const sim = calculateLevenshteinSimilarity(ngram, aliasKey);
      if (sim >= fuzzyThreshold) {
        if (!bestFuzzyMatch || sim > bestFuzzyMatch.similarity) {
          bestFuzzyMatch = { alias: item, similarity: sim };
          matchingCategoriesAtTopSim.clear();
          matchingCategoriesAtTopSim.add(item.categoryId);
        } else if (bestFuzzyMatch && Math.abs(sim - bestFuzzyMatch.similarity) < 0.001) {
          matchingCategoriesAtTopSim.add(item.categoryId);
        }
      }
    }
  }

  if (bestFuzzyMatch && bestFuzzyMatch.similarity >= fuzzyThreshold) {
    // If ambiguous (multiple distinct categories with top similarity), mark unresolved
    if (matchingCategoriesAtTopSim.size > 1) {
      return {
        raw: originalRaw,
        value: null,
        categoryId: null,
        isUnresolved: true
      };
    }
    return {
      raw: originalRaw,
      value: bestFuzzyMatch.alias.normalizedValue,
      categoryId: bestFuzzyMatch.alias.categoryId,
      isUnresolved: false
    };
  }

  // 5. Unresolved (Never force an unknown term into an arbitrary category)
  return {
    raw: originalRaw,
    value: null,
    categoryId: null,
    isUnresolved: true
  };
}

/**
 * Deduplicates a list of normalized inputs by their canonical `value` (normalizedValue),
 * NOT by categoryId. Unresolved inputs are preserved in the list for transparency.
 */
export function deduplicateNormalizedInputs(inputs: NormalizedInputs): NormalizedInputs {
  const seenCanonicalValues = new Set<string>();
  const seenUnresolvedRaws = new Set<string>();
  const result: NormalizedInputs = [];

  for (const item of inputs) {
    if (item.isUnresolved || !item.value) {
      const rawKey = (item.raw || "").toLowerCase().trim();
      if (!seenUnresolvedRaws.has(rawKey)) {
        seenUnresolvedRaws.add(rawKey);
        result.push(item);
      }
    } else {
      const canonicalKey = item.value.toLowerCase().trim();
      if (!seenCanonicalValues.has(canonicalKey)) {
        seenCanonicalValues.add(canonicalKey);
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Normalizes multiple skill entries and deduplicates by canonical skill value
 */
export function normalizeSkills(
  rawSkills: string[],
  aliases: StaticAlias[] = INITIAL_ALIASES,
  fuzzyThreshold: number = DEFAULT_FUZZY_SIMILARITY_THRESHOLD
): NormalizedInputs {
  if (!Array.isArray(rawSkills)) return [];
  const normalized = rawSkills.map(s => normalizeSingleInput(s, aliases, fuzzyThreshold));
  return deduplicateNormalizedInputs(normalized);
}

/**
 * Normalizes multiple preference entries and deduplicates by canonical value
 */
export function normalizePreferences(
  rawPreferences: string[],
  aliases: StaticAlias[] = INITIAL_ALIASES,
  fuzzyThreshold: number = DEFAULT_FUZZY_SIMILARITY_THRESHOLD
): NormalizedInputs {
  if (!Array.isArray(rawPreferences)) return [];
  const normalized = rawPreferences.map(p => normalizeSingleInput(p, aliases, fuzzyThreshold));
  return deduplicateNormalizedInputs(normalized);
}

/**
 * Normalizes multiple past experience entries and deduplicates by canonical value
 */
export function normalizeExperiences(
  rawExperiences: string[],
  aliases: StaticAlias[] = INITIAL_ALIASES,
  fuzzyThreshold: number = DEFAULT_FUZZY_SIMILARITY_THRESHOLD
): NormalizedInputs {
  if (!Array.isArray(rawExperiences)) return [];
  const normalized = rawExperiences.map(e => normalizeSingleInput(e, aliases, fuzzyThreshold));
  return deduplicateNormalizedInputs(normalized);
}

/**
 * Normalizes a single primary career/livelihood goal
 */
export function normalizeGoal(
  rawGoal?: string | null,
  aliases: StaticAlias[] = INITIAL_ALIASES,
  fuzzyThreshold: number = DEFAULT_FUZZY_SIMILARITY_THRESHOLD
): NormalizedGoal {
  if (!rawGoal || typeof rawGoal !== "string" || !rawGoal.trim()) {
    return null;
  }
  return normalizeSingleInput(rawGoal, aliases, fuzzyThreshold);
}
