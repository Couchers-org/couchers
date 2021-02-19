import { Meta, Story } from "@storybook/react";

import ProfileTextInput from "./ProfileTextInput";

export default {
  title: "Profile/ProfileTextInput",
  component: ProfileTextInput,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <ProfileTextInput {...args} />
  </>
);

export const profileTextInput = Template.bind({});
profileTextInput.args = {
  label: "Text input",
};
