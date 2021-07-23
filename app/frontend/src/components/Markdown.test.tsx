import { getByRole, render, screen } from "@testing-library/react";

import Markdown, { increaseMarkdownHeaderLevel } from "./Markdown";

describe("markdown header level increase", () => {
  it.each`
    source                                           | topLevel | result
    ${"#hi\n##hello\nYo\n###omg"}                    | ${3}     | ${"###hi\n####hello\nYo\n#####omg"}
    ${"#hi\n##hello\nYo\n###omg"}                    | ${1}     | ${"#hi\n##hello\nYo\n###omg"}
    ${"#hi\n##hello\nYo\n###omg"}                    | ${6}     | ${"######hi\n######hello\nYo\n######omg"}
    ${"#h1\n##h2\n###h3\n####h4\n#####h5\n######h6"} | ${3}     | ${"###h1\n####h2\n#####h3\n######h4\n######h5\n######h6"}
    ${"#h1\n##h2\n###h3\n####h4\n#####h5\n######h6"} | ${2}     | ${"##h1\n###h2\n####h3\n#####h4\n######h5\n######h6"}
    ${"#h1\n##h2\n###h3\n####h4\n#####h5\n######h6"} | ${4}     | ${"####h1\n#####h2\n######h3\n######h4\n######h5\n######h6"}
    ${"#h1\n##h2\n###h3\n####h4\n#####h5\n######h6"} | ${5}     | ${"#####h1\n######h2\n######h3\n######h4\n######h5\n######h6"}
  `("increases to h$topLevel for $source", ({ source, topLevel, result }) => {
    expect(increaseMarkdownHeaderLevel(source, topLevel)).toBe(result);
  });
});

describe("Markdown widget", () => {
  it("strips html except <br>", () => {
    render(
      <div data-testid="root">
        <Markdown
          source={'# <div data-testid="bad">text\n<br></div>\nmore text'}
          topHeaderLevel={1}
        />
      </div>
    );
    expect(screen.queryByTestId("bad")).toBeNull();
    expect(screen.getByTestId("root")).toContainHTML("<br>");
  });
  it("converts markdown image to link", () => {
    render(
      <div data-testid="root">
        <Markdown
          source={"# MD\nan image: ![image](https://example.com)"}
          topHeaderLevel={1}
        />
      </div>
    );
    expect(screen.queryByAltText("image")).toBeNull();
    expect(
      getByRole(screen.getByTestId("root"), "link", { name: "image" })
    ).toHaveAttribute("href", "https://example.com");
  });
});
