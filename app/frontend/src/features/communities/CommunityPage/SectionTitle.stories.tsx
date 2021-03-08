import { Meta, Story } from "@storybook/react";

import { PersonIcon } from "../../../components/Icons";
import SectionTitle from "./SectionTitle";

export default {
  component: SectionTitle,
  title: "Communities/CommunityPage/SectionTitle",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <SectionTitle {...args} />
  </>
);

export const sectionTitle = Template.bind({});
sectionTitle.args = {
  children: "Groups",
  icon: <PersonIcon />,
};
