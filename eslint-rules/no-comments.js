const TYPE_TAGS = [
  'type',
  'param',
  'returns',
  'return',
  'typedef',
  'template',
  'satisfies',
  'property',
  'prop',
];
const TYPE_TAG_PATTERN = new RegExp(`^@(?:${TYPE_TAGS.join('|')})\\b`);
const TYPE_ONLY_TAGS = new Set(['type', 'satisfies']);
const TYPE_KEYWORDS = new Set([
  'keyof',
  'typeof',
  'readonly',
  'infer',
  'new',
  'extends',
  'abstract',
  'in',
  'out',
  'is',
  'asserts',
]);
const PREFIX_KEYWORDS = new Set([
  'keyof',
  'typeof',
  'readonly',
  'infer',
  'new',
  'out',
  'abstract',
  'asserts',
]);
const INFIX_KEYWORDS = new Set(['extends', 'in', 'is']);
const NUMBER_PATTERN = /^\d/;
const UNICODE_IDENTIFIER_PATTERN = /^[\p{L}$_][\p{L}\p{N}$_]*$/u;
const isOperatorToken = (text) => !UNICODE_IDENTIFIER_PATTERN.test(text) && !NUMBER_PATTERN.test(text);

const stripStringLiterals = (text) => {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      out += "''";
      i += 1;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          i += 1;
        }
        i += 1;
      }
    } else {
      out += ch;
    }
  }
  return out;
};

const tokenizeTypeFragment = (fragment) => {
  const defused = fragment.replace(/[\p{Cf}\u2800\u3164\uFFA0]/gu, ' ');
  const stripped = stripStringLiterals(defused.trim());
  const tokens = [];
  const pattern = /[\p{L}$_][\p{L}\p{N}$_]*|\d+(?:\.\d+)?|[^\s]/gu;
  let match = pattern.exec(stripped);
  while (match !== null) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length });
    match = pattern.exec(stripped);
  }
  return { stripped, tokens };
};

const scanDelimiters = (text, stack) => {
  const next = [...stack];
  let closedAt = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i += 1;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          i += 1;
        }
        i += 1;
      }
      continue;
    }
    if (ch === '=' && text[i + 1] === '>') {
      i += 1;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[' || ch === '<') {
      next.push(ch);
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']' || ch === '>') {
      const opener = { '}': '{', ')': '(', ']': '[', '>': '<' }[ch];
      if (next.length === 0 || next[next.length - 1] !== opener) {
        return { stack: next, closedAt, mismatch: true };
      }
      next.pop();
      if (next.length === 0 && closedAt === null) {
        closedAt = i;
      }
    }
  }
  return { stack: next, closedAt, mismatch: false };
};

const isTypeFragmentPlausible = (fragment) => {
  const { stripped, tokens } = tokenizeTypeFragment(fragment);
  const compact = stripped.replace(/\s+/g, '');
  if (compact !== '*' && compact !== '{*}') {
    for (const token of tokens) {
      if (token.text === '/' || token.text === '*') {
        return false;
      }
    }
  }
  const scopeStack = [];
  let inPair = false;
  let questionSeen = false;
  let infixSeen = false;
  const resetInfix = () => {
    infixSeen = false;
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const text = token.text;
    if (i > 0) {
      const prev = tokens[i - 1];
      const gap = stripped.slice(prev.end, token.start);
      if (gap.length > 0) {
        const leftOk = isOperatorToken(prev.text) || TYPE_KEYWORDS.has(prev.text);
        const rightOk = isOperatorToken(text) || TYPE_KEYWORDS.has(text);
        if (!leftOk && !rightOk) {
          return false;
        }
      }
      if (PREFIX_KEYWORDS.has(text) && UNICODE_IDENTIFIER_PATTERN.test(prev.text) && !TYPE_KEYWORDS.has(prev.text)) {
        return false;
      }
    }
    if (INFIX_KEYWORDS.has(text)) {
      if (infixSeen) {
        return false;
      }
      const prev = i > 0 ? tokens[i - 1] : null;
      const prevIsOperand =
        prev !== null &&
        (UNICODE_IDENTIFIER_PATTERN.test(prev.text) ||
          NUMBER_PATTERN.test(prev.text) ||
          prev.text === ')' ||
          prev.text === ']' ||
          prev.text === '>' ||
          prev.text === '}' ||
          prev.text === "'" ||
          prev.text === '"' ||
          prev.text === '`');
      if (!prevIsOperand) {
        return false;
      }
      infixSeen = true;
    }
    if (text === '-' || text === '+') {
      const next = tokens[i + 1];
      const nextGap = next ? stripped.slice(token.end, next.start) : null;
      if (!next || nextGap !== '' || !(next.text === 'readonly' || NUMBER_PATTERN.test(next.text))) {
        return false;
      }
    } else if (text === '=') {
      const next = tokens[i + 1];
      const nextGap = next ? stripped.slice(token.end, next.start) : null;
      const isArrow = next && nextGap === '' && next.text === '>';
      const prev = i > 0 ? tokens[i - 1] : null;
      const prevIsParen = prev !== null && prev.text === ')';
      const inAngle = scopeStack.length > 0 && scopeStack[scopeStack.length - 1].opener === '<';
      resetInfix();
      if (isArrow && prevIsParen) {
        i += 1;
      } else if (!isArrow && inAngle) {
        continue;
      } else {
        return false;
      }
    } else if (text === ':') {
      if (inPair && !questionSeen) {
        return false;
      }
      inPair = true;
      questionSeen = false;
      resetInfix();
      const top = scopeStack[scopeStack.length - 1];
      if (top) {
        top.colonSeen = true;
      }
    } else if (text === '?') {
      questionSeen = true;
      resetInfix();
    } else if (text === '{' || text === '(' || text === '[' || text === '<') {
      scopeStack.push({ opener: text, colonSeen: false });
      resetInfix();
      if (text === '{') {
        inPair = false;
      }
    } else if (text === ',' || text === ';') {
      const top = scopeStack[scopeStack.length - 1];
      if (!top || ((top.opener === '{' || top.opener === '(') && !top.colonSeen)) {
        return false;
      }
      inPair = false;
      questionSeen = false;
      resetInfix();
    } else if (text === '|' || text === '&') {
      inPair = false;
      questionSeen = false;
      resetInfix();
    } else if (text === '}' || text === ')' || text === ']' || text === '>') {
      const opener = { '}': '{', ')': '(', ']': '[', '>': '<' }[text];
      const top = scopeStack[scopeStack.length - 1];
      if (!top || top.opener !== opener) {
        return false;
      }
      scopeStack.pop();
      inPair = false;
      questionSeen = false;
      resetInfix();
    }
  }
  return true;
};

const validateDescriptionGroups = (rest) => {
  let i = 0;
  while (i < rest.length) {
    const start = findGroupStart(rest, i);
    if (start === -1) {
      return true;
    }
    const end = findGroupEnd(rest, start);
    if (end === -1) {
      return false;
    }
    if (!isTypeFragmentPlausible(rest.slice(start, end + 1))) {
      return false;
    }
    i = end + 1;
  }
  return true;
};

const findGroupStart = (text, fromIndex) => {
  for (let i = fromIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i += 1;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          i += 1;
        }
        i += 1;
      }
      continue;
    }
    if (ch === '{') {
      return i;
    }
  }
  return -1;
};

const findGroupEnd = (text, startIndex) => {
  let depth = 0;
  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i += 1;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          i += 1;
        }
        i += 1;
      }
      continue;
    }
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
};
const IDENTIFIER_CHAR_PATTERN = /[A-Za-z0-9_$]/;

const normalizeComment = (comment) =>
  comment.value
    .split('\n')
    .map((line) => line.replace(/^[\s*]*/, ''))
    .filter((line) => line.length > 0)
    .join('\n');

const GLOBAL_ATTRS = new Set(['true', 'false', 'readonly', 'writable', 'writeable']);
const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/;
const GLOBAL_ENTRY_PATTERN = /^([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z]+))?\s*$/;

const parseGlobalDeclaration = (rest) => {
  const parts = rest.split(',');
  return (
    parts.length > 0 &&
    parts.every((part) => {
      const match = GLOBAL_ENTRY_PATTERN.exec(part.trim());
      if (!match) {
        return false;
      }
      return match[2] === undefined || GLOBAL_ATTRS.has(match[2]);
    })
  );
};

const parseExportedDeclaration = (rest) => {
  const parts = rest.split(',');
  return parts.length > 0 && parts.every((part) => IDENTIFIER_PATTERN.test(part.trim()));
};

const isDirective = (normalized) => {
  if (/^@ts-(expect-error|ignore)([ \t]+.*)?$/.test(normalized)) {
    return true;
  }
  if (/^eslint-disable(-next-line|-line)?(?:[ \t]+[\w/@-]+(?:[ \t]*,[ \t]*[\w/@-]+)*)?(?:[ \t]+--[ \t]*.*)?[ \t]*$/.test(normalized)) {
    return true;
  }
  if (/^eslint-enable(?:[ \t]+[\w/@-]+(?:[ \t]*,[ \t]*[\w/@-]+)*)?(?:[ \t]+--[ \t]*.*)?[ \t]*$/.test(normalized)) {
    return true;
  }
  if (/^eslint-env[ \t]+[\w$-]+(?:[ \t]*,[ \t]*[\w$-]+)*[ \t]*$/.test(normalized)) {
    return true;
  }
  if (/^eslint[ \t]+[\w/@-]+[ \t]*:[ \t]*(?:\[(?:[^[\]]|\[[^[\]]*\])*\]|0|1|2|off|warn|error)(?:[ \t]*,[ \t]*[\w/@-]+[ \t]*:[ \t]*(?:\[(?:[^[\]]|\[[^[\]]*\])*\]|0|1|2|off|warn|error))*[ \t]*$/.test(normalized)) {
    return true;
  }
  const globalMatch = /^global\s+([\s\S]*)$/.exec(normalized);
  if (globalMatch && parseGlobalDeclaration(globalMatch[1])) {
    return true;
  }
  const exportedMatch = /^exported\s+([\s\S]*)$/.exec(normalized);
  if (exportedMatch && parseExportedDeclaration(exportedMatch[1])) {
    return true;
  }
  if (/^@vitest-environment\s+[a-z][a-z0-9-]*\s*$/.test(normalized)) {
    return true;
  }
  if (/^\/\s*<reference\s+(path|types|lib)\s*=\s*(["'])[^"']*\2\s*\/>\s*$/.test(normalized)) {
    return true;
  }
  return false;
};

const isJSDocTypeLines = (lines) => {
  if (lines.length === 0) {
    return false;
  }
  let openType = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const tagMatch = TYPE_TAG_PATTERN.exec(line);
    if (tagMatch) {
      if (openType) {
        return false;
      }
      const tag = tagMatch[0].slice(1);
      const typeOnly = TYPE_ONLY_TAGS.has(tag);
      const rest = line.slice(tagMatch[0].length);
      const groupStart = findGroupStart(rest, 0);
      if (groupStart !== -1) {
        const before = rest.slice(0, groupStart);
        if (typeOnly) {
          if (before.trim() !== '') {
            return false;
          }
        } else if (before.trim() !== '') {
          if (!/^[ \t]*\[?[A-Za-z_$][\w$]*\]?([ \t]+-[ \t].*)?[ \t]*$/.test(before)) {
            return false;
          }
          if (!validateDescriptionGroups(rest)) {
            return false;
          }
          continue;
        }
        const groupEnd = findGroupEnd(rest, groupStart);
        if (groupEnd !== -1) {
          const group = rest.slice(groupStart, groupEnd + 1);
          if (!isTypeFragmentPlausible(group)) {
            return false;
          }
          if (typeOnly && rest.slice(groupEnd + 1).trim() !== '') {
            return false;
          }
        } else {
          const typePortion = rest.slice(groupStart);
          if (!isTypeFragmentPlausible(typePortion)) {
            return false;
          }
          const scan = scanDelimiters(typePortion, []);
          if (scan.mismatch) {
            return false;
          }
          openType = { typeOnly, accumulated: typePortion, stack: scan.stack };
        }
      } else if (typeOnly) {
        if (!isTypeFragmentPlausible(rest)) {
          return false;
        }
        const scan = scanDelimiters(rest, []);
        if (scan.mismatch) {
          return false;
        }
        if (scan.stack.length > 0) {
          openType = { typeOnly, accumulated: rest, stack: scan.stack };
        }
      } else if (tag === 'returns' || tag === 'return') {
        if (rest.trim() !== '') {
          return false;
        }
      } else if (!/^[ \t]*\[?[A-Za-z_$][\w$]*\]?([ \t]+-[ \t].*)?[ \t]*$/.test(rest)) {
        return false;
      }
      continue;
    }
    if (!openType) {
      return false;
    }
    const scan = scanDelimiters(line, openType.stack);
    if (scan.mismatch) {
      return false;
    }
    const typeEnd = scan.closedAt === null ? line.length : scan.closedAt + 1;
    const accumulated = `${openType.accumulated}\n${line.slice(0, typeEnd)}`;
    if (!isTypeFragmentPlausible(accumulated)) {
      return false;
    }
    if (scan.closedAt !== null) {
      if (openType.typeOnly && line.slice(typeEnd).trim() !== '') {
        return false;
      }
      openType = null;
    } else {
      openType = { ...openType, accumulated, stack: scan.stack };
    }
  }
  return openType === null;
};

const isJSDocComment = (comment, sourceCode) =>
  comment.type === 'Block' && sourceCode.text.slice(comment.range[0], comment.range[1]).startsWith('/**');

const isJSDocTypeComment = (comment, sourceCode) => {
  if (!isJSDocComment(comment, sourceCode)) {
    return false;
  }
  return isJSDocTypeLines(normalizeComment(comment).split('\n'));
};

const SPDX_IDS = [
  'MIT',
  'MIT-0',
  'Apache-2.0',
  'BSD-1-Clause',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-3-Clause-Clear',
  'ISC',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'LGPL-2.0-only',
  'LGPL-2.0-or-later',
  'LGPL-2.1-only',
  'LGPL-2.1-or-later',
  'LGPL-3.0-only',
  'LGPL-3.0-or-later',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'MPL-2.0',
  'EPL-1.0',
  'EPL-2.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'Unlicense',
  'BSL-1.0',
  'Zlib',
  'Artistic-2.0',
  'WTFPL',
  '0BSD',
  'CDDL-1.0',
  'EUPL-1.2',
  'PostgreSQL',
  'NCSA',
  'OpenSSL',
  'PSF-2.0',
  'Ruby',
  'Vim',
  'X11',
  'OFL-1.1',
  'MS-PL',
  'MS-RL',
  'AFL-3.0',
  'APL-1.0',
  'BlueOak-1.0.0',
  'LicenseRef-[\\w.-]+',
  'DocumentRef-[\\w.-]+:LicenseRef-[\\w.-]+',
].join('|');
const LICENSE_NAME_PATTERN = '(?:the\\s+)?(?:mit|apache|bsd|isc|gpl|lgpl|mpl|epl|cc0|unlicense)[\\s-]*license';
const LICENSE_CONNECTOR = 'the|of|and|or|version|a|an|for';
const CAPITALIZED_WORD = '[A-Z0-9©&][\\w.,\'&()-]*';

const isCopyrightLine = (line) => {
  const prefix = /^copyright([\s(©])/i.exec(line);
  if (!prefix) {
    return false;
  }
  const rest = line.slice(prefix[0].length - 1);
  return new RegExp(`^(?:\\s*\\(c\\)|\\s*©)?\\s*\\d{4}(?:\\s*[-–]\\s*\\d{4})?,?(?:\\s+${CAPITALIZED_WORD})*\\s*$`).test(rest);
};

const isCBracketLine = (line) =>
  /^\((c|©)\)\s*\d{4}(?:\s*[-–]\s*\d{4})?,?(?:\s+[A-Z0-9©&][\w.,'&()-]*)*\s*$/.test(line);

const isAuthorLine = (line) => {
  const prefix = /^authors?\s*:/i.exec(line);
  if (!prefix) {
    return false;
  }
  const rest = line.slice(prefix[0].length);
  return /^[ \t]*[A-Z][\w.,'&()-]*(?:[ \t]+[A-Z][\w.,'&()-]*)*[ \t]*$/.test(rest);
};

const isLicensedUnderLine = (line) => {
  const prefix = /^licensed\s+under\s+/i.exec(line);
  if (!prefix) {
    return false;
  }
  const rest = line.slice(prefix[0].length);
  return new RegExp(
    `^(?:the\\s+)?[A-Z][\\w.,()-]*(?:\\s+(?:[A-Z\\d][\\w.,()-]*|${LICENSE_CONNECTOR}))*\\.?\\s*$`,
  ).test(rest);
};

const isThisFileLicensedLine = (line) => {
  const prefix = /^this\s+file\s+is\s+licensed\s+under\s+/i.exec(line);
  if (!prefix) {
    return false;
  }
  const rest = line.slice(prefix[0].length);
  return new RegExp(
    `^(?:the\\s+)?[A-Z][\\w.,()-]*(?:\\s+(?:[A-Z\\d][\\w.,()-]*|${LICENSE_CONNECTOR}))*\\.?\\s*$`,
  ).test(rest);
};

const LICENSE_ANCHOR_PATTERNS = [
  new RegExp(`^spdx-license-identifier\\s*:\\s*(?:${SPDX_IDS})(?:\\s+(?:or|and)\\s*(?:${SPDX_IDS}))*\\s*$`, 'i'),
  /^license\s*:\s*[\w.+-]+(?:\s+(?:or|and)\s+[\w.+-]+)*\s*$/i,
  new RegExp(`^${LICENSE_NAME_PATTERN}(?:\\s*,\\s*version\\s*[\\d.]+)?\\.?\\s*$`, 'i'),
];
const LICENSE_LINE_PATTERNS = [
  ...LICENSE_ANCHOR_PATTERNS,
  /^all\s+rights\s+reserved\.?\s*$/i,
  /^version\s+[\d.]+(?:\s*,\s*[A-Z][a-z]+\s+\d{4})?\.?\s*$/i,
  /^https?:\/\/\S+\s*$/i,
  /^see\s+(?:the\s+|a\s+)?licen[sc]e(?:\s+(?:file|for\s+details))?\.?\s*$/i,
];

const MIT_LICENSE_BODY = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const normalizeLicenseBody = (text) => text.replace(/\s+/g, ' ').trim();
const MIT_BODY_NORMALIZED = normalizeLicenseBody(MIT_LICENSE_BODY);

const isMitLicenseBlock = (normalized) => {
  const lines = normalized.split('\n');
  let index = 0;
  if (lines.length > 0 && /^mit\s+license\.?\s*$/i.test(lines[0])) {
    index = 1;
  }
  if (index >= lines.length || !isCopyrightLine(lines[index])) {
    return false;
  }
  const body = normalizeLicenseBody(lines.slice(index + 1).join('\n'));
  return body === MIT_BODY_NORMALIZED;
};

export const isLicenseHeader = (normalized) => {
  if (isMitLicenseBlock(normalized)) {
    return true;
  }
  const lines = normalized.split('\n');
  if (lines.length === 0) {
    return false;
  }
  const isAnchorLine = (line) =>
    isCopyrightLine(line) ||
    isCBracketLine(line) ||
    isLicensedUnderLine(line) ||
    isThisFileLicensedLine(line) ||
    LICENSE_ANCHOR_PATTERNS.some((pattern) => pattern.test(line));
  if (!lines.some(isAnchorLine)) {
    return false;
  }
  return lines.every(
    (line) =>
      isCopyrightLine(line) ||
      isCBracketLine(line) ||
      isAuthorLine(line) ||
      isLicensedUnderLine(line) ||
      isThisFileLicensedLine(line) ||
      LICENSE_LINE_PATTERNS.some((pattern) => pattern.test(line)),
  );
};

export const isAllowedComment = (text) => {
  const normalized = text
    .split('\n')
    .map((line) => line.replace(/^[\s*]*/, ''))
    .filter((line) => line.length > 0)
    .join('\n');
  if (isDirective(normalized)) {
    return true;
  }
  if (!text.startsWith('*')) {
    return false;
  }
  return isJSDocTypeLines(normalized.split('\n'));
};

const computeLeadingBlock = (sourceCode) => {
  const comments = sourceCode.getAllComments();
  const firstToken = sourceCode.getFirstToken(sourceCode.ast);
  const block = [];
  let cursor = 0;
  for (const comment of comments) {
    if (firstToken && comment.range[1] > firstToken.range[0]) {
      break;
    }
    const gap = sourceCode.text.slice(cursor, comment.range[0]);
    if (block.length === 0) {
      if (!/^\s*(#!.*\n)?\s*$/.test(gap)) {
        break;
      }
    } else if (!/^\s*$/.test(gap)) {
      break;
    }
    block.push(comment);
    cursor = comment.range[1];
  }
  return block;
};

const removalRange = (sourceCode, comment) => {
  const text = sourceCode.text;
  let [start, end] = comment.range;
  const before = sourceCode.getTokenBefore(comment, { includeComments: true });
  const after = sourceCode.getTokenAfter(comment, { includeComments: true });
  const container = before ? sourceCode.getNodeByRangeIndex(before.range[0]) : null;
  if (container?.type === 'JSXExpressionContainer' && before?.value === '{' && after?.value === '}' && before.range[1] <= start && after.range[0] >= end) {
    const between = text.slice(before.range[1], start) + text.slice(end, after.range[0]);
    if (between.trim() === '') [start, end] = [before.range[0], after.range[1]];
  }
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const nextNewline = text.indexOf('\n', end);
  const lineEnd = nextNewline === -1 ? text.length : nextNewline;
  if (text.slice(lineStart, start).trim() === '' && text.slice(end, lineEnd).trim() === '') {
    return [lineStart, nextNewline === -1 ? lineEnd : nextNewline + 1];
  }
  let trimStart = start;
  while (trimStart > lineStart && /[ \t]/.test(text[trimStart - 1])) trimStart -= 1;
  return [trimStart, end];
};

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow code comments except license headers and tool directives' },
    fixable: 'code',
    schema: [],
    messages: { noComment: 'Code comments are not allowed. Express intent in names and types.' },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      Program() {
        const leadingBlock = computeLeadingBlock(sourceCode);
        const leadingSet = new Set(leadingBlock);
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type === 'Shebang') continue;
          const normalized = normalizeComment(comment);
          if (isDirective(normalized) || isJSDocTypeComment(comment, sourceCode)) continue;
          if (leadingSet.has(comment) && isLicenseHeader(normalized)) continue;
          if (leadingSet.has(comment) && /^@ts-(check|nocheck)[ \t]*$/.test(normalized)) continue;
          context.report({
            loc: comment.loc,
            messageId: 'noComment',
            fix: (fixer) => {
              const range = removalRange(sourceCode, comment);
              const beforeChar = sourceCode.text[range[0] - 1];
              const afterChar = sourceCode.text[range[1]];
              if (
                beforeChar !== undefined &&
                afterChar !== undefined &&
                IDENTIFIER_CHAR_PATTERN.test(beforeChar) &&
                IDENTIFIER_CHAR_PATTERN.test(afterChar)
              ) {
                return fixer.replaceTextRange(range, ' ');
              }
              return fixer.removeRange(range);
            },
          });
        }
      },
    };
  },
};
