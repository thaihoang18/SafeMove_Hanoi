export const COMMENT_BLOCKLIST = [
  "dit",
  "dcm",
  "dmm",
  "dm",
  "deo",
  "dit me",
  "dit me may",
  "con me",
  "me may",
  "lon",
  "loz",
  "buoi",
  "cac",
  "vcl",
  "vl",
  "clm",
  "cmm",
  "fuck",
  "fucking",
  "fucker",
  "shit",
  "shitty",
  "bitch",
  "asshole",
  "sex",
  "porn",
  "xxx",
] as const;

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  "$": "s",
  "!": "i",
  "+": "t",
  "|": "l",
  ".": "",
  ",": "",
  "-": "",
  "_": "",
  "*": "",
};

const BLOCKED_PATTERNS = COMMENT_BLOCKLIST.map((keyword) => [keyword, buildBlockedPattern(keyword)] as const);

export function normalizeCommentText(value: string) {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d");

  return normalized
    .replace(/[0-9@!$+|]/g, (character) => LEET_MAP[character] ?? character)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

export function containsBlockedKeyword(comment: string) {
  const normalizedComment = normalizeCommentText(comment);

  // flattened removes any non-alphanumeric characters so obfuscated spaced or punctuated
  // variants like "d c m" or "d.c.m" become "dcm" which helps catch substrings.
  const flattened = normalizedComment.replace(/[^a-z0-9]/g, "");

  // quick substring check on flattened form
  for (const kw of COMMENT_BLOCKLIST) {
    const nk = normalizeCommentText(kw).replace(/[^a-z0-9]/g, "");
    if (nk && flattened.includes(nk)) return true;
  }

  return BLOCKED_PATTERNS.some(([, pattern]) => pattern.test(normalizedComment));
}

function buildBlockedPattern(keyword: string) {
  const normalizedKeyword = normalizeCommentText(keyword).replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalizedKeyword) {
    return new RegExp("$^");
  }

  const tokenPatterns = normalizedKeyword
    .split(" ")
    .filter(Boolean)
    .map((token) => [...token].map((character) => `${escapeRegExp(character)}+`).join("[^a-z0-9]*"));

  return new RegExp(`(^|[^a-z0-9])${tokenPatterns.join("[^a-z0-9]*")}([^a-z0-9]|$)`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}