import { Meta, Story } from "@storybook/react";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import { useState } from "react";

export default {
  component: ProfileMarkdownInput,
  title: "Profile/ProfileMarkdownInput",
} as Meta;

const Template: Story<any> = (args) => {
  const [value, setValue] = useState("");
  return (
    <>
      <ProfileMarkdownInput
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    </>
  );
};

export const profileMarkdownInput = Template.bind({});
profileMarkdownInput.args = {
  label: "Markdown input",
};
