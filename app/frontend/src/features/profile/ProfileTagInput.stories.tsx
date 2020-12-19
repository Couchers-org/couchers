import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";

import ProfileTagInput from "./ProfileTagInput";

export default {
  title: "Profile/ProfileTagInput",
  component: ProfileTagInput,
  argTypes: {
    onChange: { action: "Change value through react-hook-form" },
  },
} as Meta;

const Template: Story<any> = (args) => <ProfileTagInput {...args} />;

export const Default = Template.bind({});
Default.args = {
  value: ["English", "Bot"],
  options: [],
  label: "Languages Spoken",
  id: "languages-spoken",
};
