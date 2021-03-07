import { Meta, Story } from "@storybook/react";

import { CommunityIcon } from "../../../components/Icons";
import CircularIconButton from "./CircularIconButton";

export default {
  argTypes: {
    onClick: { action: "click" },
  },
  component: CircularIconButton,
  title: "Communities/CommunityPage/CircularIconButton",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <CircularIconButton {...args}>
      <CommunityIcon />
    </CircularIconButton>
  </>
);

export const circularIconButton = Template.bind({});
circularIconButton.args = {
  id: "community-button",
  label: "Communnity",
};
