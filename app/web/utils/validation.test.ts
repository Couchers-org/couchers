import { trimmedLength } from "./validation";

const NBSP = String.fromCodePoint(0xa0);
const IDEOGRAPHIC_SPACE = String.fromCodePoint(0x3000);
const BOM = String.fromCodePoint(0xfeff);
const EMOJI = String.fromCodePoint(0x1f600);

describe("trimmedLength", () => {
  it.each([
    ["", 0],
    ["   ", 0],
    ["hello", 5],
    ["  hello  ", 5],
    ["\n\n\thello \r\n", 5],
    ["two  inner   spaces", 19],
    // non-breaking and ideographic spaces are whitespace too, and the backend strips the same set
    [NBSP + "hello" + IDEOGRAPHIC_SPACE, 5],
    [BOM + "hello" + BOM, 5],
    // surrogate pairs count as two, which is what the backend counts as well
    [EMOJI, 2],
    ["ab" + EMOJI + "c ", 5],
  ])("counts %j as %i", (text, expected) => {
    expect(trimmedLength(text)).toBe(expected);
  });
});
