import { Meta, Story } from "@storybook/react";
import ProfileTextInput from "features/profile/ProfileTextInput";

export default {
  component: ProfileTextInput,
  title: "Profile/ProfileTextInput",
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
