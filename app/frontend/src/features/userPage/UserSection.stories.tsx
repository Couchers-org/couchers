import { Meta, Story } from "@storybook/react";

import UserSection from "./UserSection";

export default {
  title: "Profile/UserSection",
  component: UserSection,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <UserSection {...args}>Section content</UserSection>
  </>
);

export const userSection = Template.bind({});
userSection.args = { title: "Example Section" };
