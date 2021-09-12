import React from "react";
import renderer from "react-test-renderer";

import LargeButton from "./LargeButton";

describe("<LargeButton />", () => {
  it("has 1 child", () => {
    const tree: any = renderer
      .create(<LargeButton title="test" onPress={() => {}} />)
      .toJSON();
    expect(tree?.children?.length).toBe(1);
  });
});
