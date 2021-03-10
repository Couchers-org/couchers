import { Meta, Story } from "@storybook/react";
import UserSection from "features/userPage/UserSection";

export default {
  component: UserSection,
  title: "Profile/UserSection",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <UserSection {...args}>Section content</UserSection>
  </>
);

export const userSection = Template.bind({});
userSection.args = { title: "Example Section" };
