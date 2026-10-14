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
const TYPE_OPERATORS = new Set(['|', '&', ':', ',', '=', '<', '>', '(', ')', '[', ']', '{', '}', '?']);
const isTypeContinuation = (line) => {
  const stripped = line.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''").replace(/`[^`]*`/g, '``');
  for (let i = 0; i < stripped.length; i += 1) {
    if (stripped[i] !== ' ' && stripped[i] !== '\t') {
      continue;
    }
    if (!TYPE_OPERATORS.has(stripped[i - 1]) && !TYPE_OPERATORS.has(stripped[i + 1])) {
      return false;
    }
  }
  return true;
};
const IDENTIFIER_CHAR_PATTERN = /[A-Za-z0-9_$]/;

const normalizeComment = (comment) =>
  comment.value
    .split('\n')
    .map((line) => line.replace(/^[\s*]*/, ''))
    .filter((line) => line.length > 0)
    .join('\n');

const isDirective = (normalized) => {
  if (/^@ts-(expect-error|ignore)(\s+.*)?$/.test(normalized)) {
    return true;
  }
  if (/^eslint-disable(-next-line|-line)?(?:\s+[\w/@-]+(?:\s*,\s*[\w/@-]+)*)?(?:\s+--\s+.*)?\s*$/.test(normalized)) {
    return true;
  }
  if (/^eslint-enable(?:\s+[\w/@-]+(?:\s*,\s*[\w/@-]+)*)?(?:\s+--\s+.*)?\s*$/.test(normalized)) {
    return true;
  }
  if (/^eslint-env\s+[\w$-]+(?:\s*,\s*[\w$-]+)*\s*$/.test(normalized)) {
    return true;
  }
  if (/^eslint\s+[\w/@-]+\s*:\s*(?:\[(?:[^[\]]|\[[^[\]]*\])*\]|0|1|2|off|warn|error)(?:\s*,\s*[\w/@-]+\s*:\s*(?:\[(?:[^[\]]|\[[^[\]]*\])*\]|0|1|2|off|warn|error))*\s*$/.test(normalized)) {
    return true;
  }
  if (
    /^global\s+[A-Za-z_$][\w$]*\s*(?::\s*(?:true|false|readonly|writable|writeable))?\s*(?:,\s*[A-Za-z_$][\w$]*\s*(?::\s*(?:true|false|readonly|writable|writeable))?\s*)*$/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^exported\s+[A-Za-z_$][\w$]*\s*(?:,\s*[A-Za-z_$][\w$]*\s*)*$/.test(normalized)) {
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
  if (!TYPE_TAG_PATTERN.test(lines[0])) {
    return false;
  }
  return lines.slice(1).every((line) => TYPE_TAG_PATTERN.test(line) || isTypeContinuation(line));
};

const isJSDocComment = (comment, sourceCode) =>
  comment.type === 'Block' && sourceCode.text.slice(comment.range[0], comment.range[1]).startsWith('/**');

const isJSDocTypeComment = (comment, sourceCode) => {
  if (!isJSDocComment(comment, sourceCode)) {
    return false;
  }
  return isJSDocTypeLines(normalizeComment(comment).split('\n'));
};

export const isLicenseHeader = (normalized) => {
  if (/^copyright\b/i.test(normalized)) {
    return true;
  }
  if (/^license\s*:/i.test(normalized)) {
    return true;
  }
  if (/^licensed\s+under\b/i.test(normalized)) {
    return true;
  }
  if (/^this\s+file\s+is\s+licensed\s+under\b/i.test(normalized)) {
    return true;
  }
  if (/^spdx-license-identifier\b/i.test(normalized)) {
    return true;
  }
  if (/^(?:mit|apache|bsd|isc|gpl|lgpl|mpl)[\s-]license\b/i.test(normalized)) {
    return true;
  }
  return false;
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
          if (leadingSet.has(comment) && /^@ts-(check|nocheck)\s*$/.test(normalized)) continue;
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
