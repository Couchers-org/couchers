/**
 * Checks every `<Trans>` call site against the English string it renders.
 *
 * A tag in the string that matches nothing in `components` doesn't raise an
 * error at runtime, it just renders the tag's inner text with the wrapper
 * silently dropped, so this has to be caught statically.
 *
 * See /docs/translation-components.md.
 */

"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const namespaces = require("../i18n/namespaces");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { extractTags, isBasicHtmlTag, localeFilePath, resolveKey } = require("../i18n/transTags");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_NAMESPACE = "global";

// `AUTH` -> `"auth"`, so that `ns={AUTH}` and `useTranslation(AUTH)` resolve.
const NAMESPACE_BY_IDENTIFIER = Object.fromEntries(
  Object.entries(namespaces).filter(([, value]) => typeof value === "string"),
);

const bundleCache = new Map();

/** The en bundle for a namespace, reloaded when the file changes. */
function loadBundle(namespace) {
  const file = path.join(ROOT, localeFilePath(namespace, "en"));
  const mtime = fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs;
  if (mtime === undefined) return null;

  const cached = bundleCache.get(namespace);
  if (cached?.mtime === mtime) return cached.bundle;

  const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
  bundleCache.set(namespace, { mtime, bundle });
  return bundle;
}

function getAttribute(node, name) {
  return node.openingElement.attributes.find(
    (attribute) => attribute.type === "JSXAttribute" && attribute.name.name === name,
  );
}

/** Every string an expression can evaluate to, or null if that isn't knowable. */
function staticStrings(expression) {
  if (!expression) return null;
  switch (expression.type) {
    case "Literal":
      return typeof expression.value === "string" ? [expression.value] : null;
    case "TemplateLiteral":
      return expression.expressions.length === 0 ? [expression.quasis[0].value.cooked] : null;
    case "ConditionalExpression": {
      const consequent = staticStrings(expression.consequent);
      const alternate = staticStrings(expression.alternate);
      return consequent && alternate ? [...consequent, ...alternate] : null;
    }
    default:
      return null;
  }
}

function attributeStrings(attribute) {
  if (!attribute?.value) return null;
  if (attribute.value.type === "JSXExpressionContainer") return staticStrings(attribute.value.expression);
  return staticStrings(attribute.value);
}

/** Namespaces an expression names, whether by literal, constant or array of either. */
function namespacesFrom(expression) {
  if (!expression) return [];
  if (expression.type === "Identifier") {
    const value = NAMESPACE_BY_IDENTIFIER[expression.name];
    return value ? [value] : [];
  }
  if (expression.type === "ArrayExpression") {
    return expression.elements.flatMap((element) => namespacesFrom(element));
  }
  return staticStrings(expression) ?? [];
}

function hasRenderedChildren(node) {
  return node.children.some((child) => {
    if (child.type === "JSXText") return child.value.trim() !== "";
    if (child.type === "JSXExpressionContainer") return child.expression.type !== "JSXEmptyExpression";
    return child.type === "JSXElement" || child.type === "JSXFragment";
  });
}

/**
 * The tag names `components` provides, or null when the prop isn't a literal
 * and so can't be checked. An array provides the tags `<0>`, `<1>`, ....
 */
function componentTagNames(attribute) {
  if (!attribute) return [];
  if (attribute.value?.type !== "JSXExpressionContainer") return null;

  const expression = attribute.value.expression;
  if (expression.type === "ArrayExpression") return expression.elements.map((element, index) => String(index));
  if (expression.type !== "ObjectExpression") return null;

  const names = [];
  for (const property of expression.properties) {
    if (property.type !== "Property" || property.computed) return null;
    if (property.key.type === "Identifier") names.push(property.key.name);
    else if (property.key.type === "Literal") names.push(String(property.key.value));
    else return null;
  }
  return names;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep <Trans> call sites consistent with the strings they render",
      url: "https://github.com/Couchers-org/couchers/blob/develop/docs/translation-components.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          // Files whose call sites are still on the legacy numbered-tag style,
          // relative to app/web. Only the style reports are waived; a call site
          // that disagrees with its string is an error wherever it lives.
          allow: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      children:
        "Move this markup into `components`: as children, the tag numbering depends on how this file is formatted, so reformatting it silently breaks every translation. See docs/translation-components.md.",
      componentsArray: "`components` must be an object keyed by tag name, not an array.",
      numericTag:
        "Name this `components` entry instead of numbering it: `{{tag}}` means nothing to a translator and shifts whenever the string gains a tag. See docs/translation-components.md.",
      missingComponent:
        "`{{namespace}}:{{key}}` contains <{{tag}}> but `components` has no `{{tag}}` entry, so it will render as bare text with the <{{tag}}> wrapper dropped.",
      unusedComponent: "`components.{{tag}}` is unused: `{{namespace}}:{{key}}` contains no <{{tag}}> tag.",
      missingKey: "No string `{{key}}` in the `{{namespace}}` en locale.",
      unknownNamespace: "Cannot tell which namespace `{{key}}` belongs to; prefix it as `namespace:{{key}}`.",
    },
  },

  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);
    const isLegacyFile = allow.has(path.relative(ROOT, context.filename));

    const namespacesInFile = [];
    const transNodes = [];

    /** Resolves a key to its en string(s), searching the namespaces it could belong to. */
    function lookup(key, explicitNamespaces) {
      const [prefix, ...rest] = key.split(":");
      if (rest.length > 0) {
        const namespace = prefix;
        return { namespace, entries: resolveKey(loadBundle(namespace) ?? {}, rest.join(":")) };
      }

      const candidates =
        explicitNamespaces.length > 0
          ? explicitNamespaces
          : [...namespacesInFile, DEFAULT_NAMESPACE, ...namespaces.NAMESPACES];

      for (const namespace of new Set(candidates)) {
        const bundle = loadBundle(namespace);
        if (!bundle) continue;
        const entries = resolveKey(bundle, key);
        if (entries.length > 0) return { namespace, entries };
      }
      return { namespace: candidates[0] ?? null, entries: [] };
    }

    function check(node) {
      const keyAttribute = getAttribute(node, "i18nKey");
      const keys = attributeStrings(keyAttribute);
      const componentsAttribute = getAttribute(node, "components");
      const tagNames = componentTagNames(componentsAttribute);
      const children = hasRenderedChildren(node);
      const componentsAreArray = componentsAttribute?.value?.expression?.type === "ArrayExpression";

      if (children && !isLegacyFile) {
        context.report({ node: node.openingElement, messageId: "children" });
      }

      if (componentsAreArray && !isLegacyFile) {
        context.report({ node: componentsAttribute, messageId: "componentsArray" });
      }

      // An array's tags are numbers by construction; `componentsArray` says so.
      if (tagNames && !componentsAreArray && !isLegacyFile) {
        for (const tag of tagNames) {
          if (/^\d+$/.test(tag)) {
            context.report({ node: componentsAttribute, messageId: "numericTag", data: { tag } });
          }
        }
      }

      // Children carry their own implicit numbering, which can't be resolved
      // statically; the `children` report above is the finding for those.
      if (!keys || children || tagNames === null) return;

      for (const key of keys) {
        const { namespace, entries } = lookup(key, namespacesFrom(getAttribute(node, "ns")?.value?.expression));
        const bareKey = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;

        if (entries.length === 0) {
          const messageId = namespace ? "missingKey" : "unknownNamespace";
          context.report({ node: keyAttribute, messageId, data: { namespace, key: bareKey } });
          continue;
        }

        const tagsInString = new Set(entries.flatMap(({ value }) => extractTags(value)));
        const provided = new Set(tagNames);

        for (const tag of tagsInString) {
          if (!provided.has(tag) && !isBasicHtmlTag(tag)) {
            context.report({
              node: componentsAttribute ?? node.openingElement,
              messageId: "missingComponent",
              data: { namespace, key: bareKey, tag },
            });
          }
        }

        for (const tag of provided) {
          if (!tagsInString.has(tag)) {
            context.report({
              node: componentsAttribute,
              messageId: "unusedComponent",
              data: { namespace, key: bareKey, tag },
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        const name = callee.type === "Identifier" ? callee.name : callee.property?.name;
        if (name === "useTranslation" || name === "serverSideTranslations" || name === "appGetServerSideProps") {
          namespacesInFile.push(...node.arguments.flatMap((argument) => namespacesFrom(argument)));
        }
      },

      JSXElement(node) {
        if (node.openingElement.name.type === "JSXIdentifier" && node.openingElement.name.name === "Trans") {
          transNodes.push(node);
        }
      },

      // Deferred so that `useTranslation()` calls below a <Trans> still count.
      "Program:exit"() {
        transNodes.forEach(check);
      },
    };
  },
};
