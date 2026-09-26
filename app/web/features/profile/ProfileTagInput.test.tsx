import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import wrapper from "test/hookWrapper";

import ProfileTagInput from "./ProfileTagInput";

const collidingOptions = {
  aka: "Akan",
  fat: "Akan",
  twi: "Akan",
  fil: "Filipino",
  tgl: "Filipino",
  eng: "English",
  pol: "Polish",
  spa: "Spanish",
};

const renderPicker = (options: Record<string, string> = collidingOptions) =>
  render(
    <ProfileTagInput
      id="fluentLanguages"
      label="Languages I speak fluently"
      onChange={() => {}}
      options={options}
      value={[]}
    />,
    { wrapper },
  );

const optionLabels = () => screen.getAllByRole("option").map((option) => option.textContent);

describe("ProfileTagInput", () => {
  it("shows each colliding label as a distinct option without multiplying them", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: "Languages I speak fluently" }));

    expect(screen.getAllByRole("option", { name: /Akan/ })).toHaveLength(3);
    expect(screen.getAllByRole("option", { name: /Filipino/ })).toHaveLength(2);
  });

  it("does not keep unmatched colliding labels around while typing successive phrases", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: "Languages I speak fluently" }));
    const input = await screen.findByRole("combobox");

    await user.type(input, "eng");
    expect(optionLabels()).toEqual(["English"]);

    await user.clear(input);
    await user.type(input, "pol");
    expect(optionLabels()).toEqual(["Polish"]);

    await user.clear(input);
    await user.type(input, "span");
    expect(optionLabels()).toEqual(["Spanish"]);
  });
});
