const ALLOWED = [
  /^\s*eslint(-disable|-enable)?[\s-]/,
  /^\s*eslint-disable(-next-line|-line)?\s*$/,
  /^\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\s*global\s/,
  /^\/\s*<reference\s/,
  /^[*\s]*@vitest-environment\s/,
  /^[*!\s]*(@license|@preserve|copyright|spdx-license-identifier)/i,
];

export const isAllowedComment = (text) => ALLOWED.some((re) => re.test(text));

const removalRange = (sourceCode, comment) => {
  const text = sourceCode.text;
  let [start, end] = comment.range;
  const before = sourceCode.getTokenBefore(comment, { includeComments: true });
  const after = sourceCode.getTokenAfter(comment, { includeComments: true });
  const container = before ? sourceCode.getNodeByRangeIndex(before.range[0]) : null;
  if (container?.type === "JSXExpressionContainer" && before?.value === "{" && after?.value === "}" && before.range[1] <= start && after.range[0] >= end) {
    const between = text.slice(before.range[1], start) + text.slice(end, after.range[0]);
    if (between.trim() === "") [start, end] = [before.range[0], after.range[1]];
  }
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nextNewline = text.indexOf("\n", end);
  const lineEnd = nextNewline === -1 ? text.length : nextNewline;
  if (text.slice(lineStart, start).trim() === "" && text.slice(end, lineEnd).trim() === "") {
    return [lineStart, nextNewline === -1 ? lineEnd : nextNewline + 1];
  }
  let trimStart = start;
  while (trimStart > lineStart && /[ \t]/.test(text[trimStart - 1])) trimStart -= 1;
  return [trimStart, end];
};

export default {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow code comments except license headers and tool directives" },
    fixable: "code",
    schema: [],
    messages: { noComment: "Code comments are not allowed. Express intent in names and types." },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type === "Shebang" || isAllowedComment(comment.value)) continue;
          context.report({
            loc: comment.loc,
            messageId: "noComment",
            fix: (fixer) => fixer.removeRange(removalRange(sourceCode, comment)),
          });
        }
      },
    };
  },
};
