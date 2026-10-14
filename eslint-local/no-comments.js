const IDENTIFIER_CHAR_PATTERN = /[A-Za-z0-9_$]/;

function normalizeComment(comment) {
  const text = comment.value;
  if (comment.type === "Block") {
    return text.replace(/^[\s*]*/, "");
  }
  return text.replace(/^\s+/, "");
}

function isDirective(normalized) {
  if (/^@ts-(ignore|expect-error|nocheck|check)\b/.test(normalized)) {
    return true;
  }
  if (
    /^eslint-(disable|enable)(-line|-next-line)?(?:\s+[\w/@-]+(?:\s*,\s*[\w/@-]+)*)?\s*$/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^eslint-env\s+[\w$-]+(?:\s*,\s*[\w$-]+)*\s*$/.test(normalized)) {
    return true;
  }
  if (/^eslint\s+[\w/@-]+\s*:\s*(\[|0|1|2|off|warn|error)\b/.test(normalized)) {
    return true;
  }
  if (
    /^global\s+[A-Za-z_$][\w$]*\s*(?::\s*(?:true|false|readonly|writable|writeable))?\s*(?:,\s*[A-Za-z_$][\w$]*\s*(?::\s*(?:true|false|readonly|writable|writeable))?\s*)*$/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    /^exported\s+[A-Za-z_$][\w$]*\s*(?:,\s*[A-Za-z_$][\w$]*\s*)*$/.test(normalized)
  ) {
    return true;
  }
  return false;
}

function isLicenseHeader(normalized) {
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
}

function collectJSXContainers(node, out) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") {
    return;
  }
  if (node.type === "JSXExpressionContainer") {
    out.push(node);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        collectJSXContainers(item, out);
      }
    } else {
      collectJSXContainers(child, out);
    }
  }
}

function findCommentsOnlyJSXContainer(comment, sourceCode) {
  const containers = [];
  collectJSXContainers(sourceCode.ast, containers);
  for (const container of containers) {
    if (
      comment.range[0] < container.range[0] ||
      comment.range[1] > container.range[1]
    ) {
      continue;
    }
    const inside = sourceCode
      .getAllComments()
      .filter(
        (c) =>
          c.range[0] >= container.range[0] && c.range[1] <= container.range[1],
      )
      .sort((a, b) => a.range[0] - b.range[0]);
    let remainder = "";
    let cursor = container.range[0];
    for (const c of inside) {
      remainder += sourceCode.text.slice(cursor, c.range[0]);
      cursor = c.range[1];
    }
    remainder += sourceCode.text.slice(cursor, container.range[1]);
    if (/^\{\s*\}$/.test(remainder)) {
      return container;
    }
  }
  return null;
}

function isAllowed(comment, sourceCode, leadingBlock) {
  const normalized = normalizeComment(comment);
  if (isDirective(normalized)) {
    return true;
  }
  if (isLicenseHeader(normalized)) {
    return true;
  }
  if (leadingBlock.length > 0 && leadingBlock[0] !== comment) {
    const first = leadingBlock[0];
    if (
      isLicenseHeader(normalizeComment(first)) &&
      /license|copyright|spdx/i.test(normalized)
    ) {
      return true;
    }
  }
  return false;
}

function computeLeadingBlock(sourceCode) {
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
        const leadingBlock = computeLeadingBlock(sourceCode);
        for (const comment of sourceCode.getAllComments()) {
          if (
            sourceCode.text.slice(comment.range[0], comment.range[0] + 2) ===
            "#!"
          ) {
            continue;
          }
          if (isAllowed(comment, sourceCode, leadingBlock)) {
            continue;
          }
          context.report({
            loc: comment.loc,
            messageId: "unexpected",
            fix(fixer) {
              const container = findCommentsOnlyJSXContainer(
                comment,
                sourceCode,
              );
              if (container) {
                return fixer.removeRange(container.range);
              }
              const text = sourceCode.text;
              const start = comment.range[0];
              const end = comment.range[1];
              const beforeChar = text[start - 1];
              const afterChar = text[end];
              if (
                beforeChar !== undefined &&
                afterChar !== undefined &&
                IDENTIFIER_CHAR_PATTERN.test(beforeChar) &&
                IDENTIFIER_CHAR_PATTERN.test(afterChar)
              ) {
                return fixer.replaceTextRange([start, end], " ");
              }
              let trimStart = start;
              while (
                trimStart > 0 &&
                (text[trimStart - 1] === " " || text[trimStart - 1] === "\t")
              ) {
                trimStart -= 1;
              }
              return fixer.removeRange([trimStart, end]);
            },
          });
        }
      },
    };
  },
};

export default rule;
