const DIRECTIVE_BLOCK_PATTERN = /^\s*(eslint(\s|-|$)|global\s|exported\s)/;
const DIRECTIVE_LINE_PATTERN = /^\s*eslint-(disable|enable)\b/;
const TS_DIRECTIVE_PATTERN = /@ts-(ignore|expect-error|nocheck|check)\b/;
const LICENSE_PATTERN = /license|copyright/i;
const LEADING_ONLY_PATTERN = /^\s*(#!.*\n)?\s*$/;

function isAllowed(comment, sourceCode) {
  const text = comment.value;
  if (TS_DIRECTIVE_PATTERN.test(text)) {
    return true;
  }
  if (comment.type === "Block") {
    if (DIRECTIVE_BLOCK_PATTERN.test(text)) {
      return true;
    }
  } else if (DIRECTIVE_LINE_PATTERN.test(text)) {
    return true;
  }
  const before = sourceCode.text.slice(0, comment.range[0]);
  const isLeading = LEADING_ONLY_PATTERN.test(before);
  return isLeading && LICENSE_PATTERN.test(text);
}

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "disallow code comments except license headers and lint/TS directives",
    },
    fixable: "code",
    schema: [],
    messages: {
      unexpected:
        "Code comments are not allowed. Keep only license headers and lint/TS directives.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (isAllowed(comment, sourceCode)) {
            continue;
          }
          context.report({
            loc: comment.loc,
            messageId: "unexpected",
            fix(fixer) {
              return fixer.remove(comment);
            },
          });
        }
      },
    };
  },
};

export default rule;
