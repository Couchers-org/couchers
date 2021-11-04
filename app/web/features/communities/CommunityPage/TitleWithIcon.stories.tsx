import { Meta, Story } from "@storybook/react";

import { PersonIcon } from "../../../components/Icons";
import TitleWithIcon from "./TitleWithIcon";

export default {
  component: TitleWithIcon,
  title: "Communities/CommunityPage/TitleWithIcon",
} as Meta;

const Template: Story<any> = (args) => <TitleWithIcon {...args} />;

export const title = Template.bind({});
title.args = {
  children: "Groups",
  icon: <PersonIcon />,
};
