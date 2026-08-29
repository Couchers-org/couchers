import {
  nameCharactersValidationPattern,
  nameNoSurroundingWhitespaceValidationPattern,
  validateName,
} from "./validation";

const NBSP = String.fromCharCode(0xa0);

// Keep these cases in sync with test_is_valid_name in app/backend/src/tests/test_db.py
describe("validateName", () => {
  it.each([
    ["basic", "ab"],
    ["internal space", "a b"],
    ["hyphen", "Jean-Luc"],
    ["dot", "King K. Rool"],
    ["comma", "Doe, John"],
    ["ampersand", "Alice & Bob"],
    ["slash", "Alice / Bob"],
    ["pipe", "Alice | Bob"],
    ["apostrophe", "O'Connor"],
    ["curly quotes", "William “Bill” Clinton"],
    ["curly apostrophe", "Sha’Nia Jenkins"],
    ["Chinese", "孙悟空"],
    ["combining diacritics", "Combining Diặcritics"],
    ["Hindi combining diacritics", "काव्य"],
    ["Catalan middle dot", "Meritxell Col·lell"],
    ["Japanese middle dot", "レオナルド・ディカプリオ"],
    ["Hawaiian ʻokina", "Lanaʻi"],
  ])("accepts %s: %s", (_description, name) => {
    expect(validateName(name)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["a space", " "],
    ["spaces", "  "],
    ["a tab", "\t"],
    ["a newline", "\n"],
    ["leading whitespace", " leading whitespace"],
    ["trailing whitespace", "trailing whitespace "],
    ["surrounding whitespace", " surrounding whitespace "],
    ["a leading non-breaking space", `${NBSP}Anne`],
    ["a trailing non-breaking space", `Anne${NBSP}`],
    ["digits", "digits123"],
    ["an email", "email@domain.com"],
    ["an emoji", "Frosty the ☃️"],
    ["an exclamation mark", "exclamative!"],
    ["a question mark", "interrogative?"],
    ["an underscore", "under_score"],
    ["a table flip", "(╯‵□′)╯︵┻━┻"],
  ])("rejects %s: %s", (_description, name) => {
    expect(validateName(name)).toBe(false);
  });

  // The lookbehind assertion this replaced made the whole regex literal fail to compile on Safari
  // before 16.4, see https://github.com/Couchers-org/couchers/issues/9644
  it("uses no lookbehind assertions", () => {
    expect(nameCharactersValidationPattern.source).not.toContain("(?<");
    expect(nameNoSurroundingWhitespaceValidationPattern.source).not.toContain("(?<");
  });
});
