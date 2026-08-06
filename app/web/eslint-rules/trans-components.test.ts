import { Rule, RuleTester } from "eslint";

import transComponents from "./trans-components";

// RuleTester validates its config with structuredClone, which jsdom doesn't
// expose. Everything it clones here is plain JSON.
globalThis.structuredClone ??= ((value: unknown) => JSON.parse(JSON.stringify(value))) as typeof structuredClone;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

// `global:what_is_cs.is_it_safe.description_2` is "...who don't follow our
// <guidelines>community guidelines</guidelines>", and
// `profile:leave_reference.did_stay_explanation` carries a bare <strong>.
ruleTester.run("trans-components", transComponents as unknown as Rule.RuleModule, {
  valid: [
    '<Trans i18nKey="profile:leave_reference.did_stay_explanation" />',
    '<Trans ns={GLOBAL} i18nKey="what_is_cs.is_it_safe.description_2" components={{ guidelines: <a /> }} />',
    // A legacy file keeps its numbering until it is migrated.
    {
      code: '<Trans i18nKey="profile:leave_reference.did_stay_explanation" components={{ 1: <a /> }}>hi</Trans>',
      filename: "features/legacy/Thing.tsx",
      options: [{ allow: ["features/legacy/Thing.tsx"] }],
    },
  ],
  invalid: [
    {
      code: '<Trans i18nKey="profile:leave_reference.did_stay_explanation">Select <b>No</b></Trans>',
      errors: [{ messageId: "children" }],
    },
    {
      code: '<Trans ns={GLOBAL} i18nKey="what_is_cs.is_it_safe.description_2" />',
      errors: [{ messageId: "missingComponent" }],
    },
    {
      code: '<Trans i18nKey="global:what_is_cs.is_it_safe.description_2" components={{ 1: <a /> }} />',
      errors: [{ messageId: "numericTag" }, { messageId: "missingComponent" }, { messageId: "unusedComponent" }],
    },
    {
      code: '<Trans i18nKey="global:what_is_cs.is_it_safe.description_2" components={[<a key="x" />]} />',
      errors: [{ messageId: "componentsArray" }, { messageId: "missingComponent" }, { messageId: "unusedComponent" }],
    },
    {
      code: '<Trans i18nKey="global:no_string_by_this_name" />',
      errors: [{ messageId: "missingKey" }],
    },
    // A legacy file is still held to agreeing with the string it renders.
    {
      code: '<Trans i18nKey="global:what_is_cs.is_it_safe.description_2" components={{ 1: <a /> }} />',
      filename: "features/legacy/Thing.tsx",
      options: [{ allow: ["features/legacy/Thing.tsx"] }],
      errors: [{ messageId: "missingComponent" }, { messageId: "unusedComponent" }],
    },
  ],
});
