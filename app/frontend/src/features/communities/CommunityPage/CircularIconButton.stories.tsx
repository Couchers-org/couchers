import { Meta, Story } from "@storybook/react";

import { CommunityIcon } from "../../../components/Icons";
import CircularIconButton from "./CircularIconButton";

export default {
  title: "Communities/CommunityPage/CircularIconButton",
  component: CircularIconButton,
  argTypes: {
    onClick: { action: "click" },
  },
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <CircularIconButton {...args}>
      <CommunityIcon />
    </CircularIconButton>
  </>
);

export const circularIconButton = Template.bind({});
