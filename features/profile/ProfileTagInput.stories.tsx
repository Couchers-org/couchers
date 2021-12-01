import { Meta, Story } from "@storybook/react";
import ProfileTagInput from "features/profile/ProfileTagInput";
import React, { useState } from "react";

export default {
  component: ProfileTagInput,
  title: "Profile/ProfileTagInput",
} as Meta;

const Template: Story<any> = (args) => {
  const [value, setState] = useState(args.value);
  return (
    <ProfileTagInput
      {...args}
      value={value}
      onChange={(_, newValue) => {
        setState(newValue);
      }}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "languages-spoken",
  label: "Languages Spoken",
  options: [],
  value: ["English", "Bot"],
};
