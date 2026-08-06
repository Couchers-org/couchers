# Components inside translated strings

Strings that contain a link, some bold text, or any other markup are rendered with i18next's
[`<Trans>`](https://react.i18next.com/latest/trans-component). The markup lives in the string itself
(`Read our <guide>guide</guide>`) and `<Trans>` swaps each tag for a React element.

Which element goes with which tag is worked out by name or by position. Positional numbering is
derived from the JSX source, so reformatting the call site silently renumbers it, and a tag that no
longer matches anything renders its inner text with the wrapper dropped — no error, no console
warning. The rules below exist to keep that from happening. They are enforced by the
`couchers/trans-components` ESLint rule and by `i18n/locales.test.ts`.

See [localization.md](localization.md) for how to write and key the strings themselves.

## 1. Use named tags, never numbers

Tag names are stable and tell the translator what they are wrapping.

```tsx
// 👍
<Trans
  i18nKey="auth:login_page.no_account_prompt"
  components={{ signupLink: <StyledLink href={signupRoute} /> }}
/>
```

```json
"no_account_prompt": "No account yet? <signupLink>Join us</signupLink>"
```

```tsx
// 👎 — the meaning of `2` lives nowhere, and shifts if the string gains a tag
<Trans i18nKey="auth:login_page.no_account_prompt" components={{ 2: <StyledLink href={signupRoute} /> }} />
```

A tag number may never be changed without updating every locale file for that key in the same
commit, so renumbering is not something to do casually.

## 2. Prefer bare `<strong>`, `<i>`, `<p>` and `<br>`

These four tags are rendered as themselves and need no `components` entry at all, which is the least
that can break:

```json
"current_email_message": "Your email address is currently <strong>{{email}}</strong>."
```

```tsx
<Trans i18nKey="auth:change_email_form.current_email_message" values={{ email }} />
```

Only reach for `components` when the element needs props — a link target, a styled component, a
click handler.

## 3. Never pass children to `<Trans>`

Children make the tag numbering a function of how the file happens to be formatted, so a stray
newline from prettier is enough to break the string. Always write `<Trans />` self-closing, with the
string coming from `i18nKey` and the elements from `components`.

```tsx
// 👎
<Trans i18nKey="auth:login_page.no_account_prompt">
  No account yet? <StyledLink href={signupRoute}>Join us</StyledLink>
</Trans>
```

## Changing an existing string

Adding, removing or renaming a tag changes the contract with every translation of that key. Update
all locale files for the key in the same commit, or change the key so translators retranslate it.
