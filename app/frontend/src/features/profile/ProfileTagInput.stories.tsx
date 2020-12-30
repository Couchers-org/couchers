import { Meta, Story } from "@storybook/react/types-6-0";
import React, { useState } from "react";

import ProfileTagInput from "./ProfileTagInput";

export default {
  title: "Profile/ProfileTagInput",
  component: ProfileTagInput,
  argTypes: {},
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
  value: ["English", "Bot"],
  options: [],
  label: "Languages Spoken",
  id: "languages-spoken",
};
