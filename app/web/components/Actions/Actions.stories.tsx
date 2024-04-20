import { Meta, Story } from "@storybook/react";
import { AppButtonProps } from "components/Button";
import React from "react";

import { Default, Outlined } from "../Button/Button.stories";
import Actions from "./Actions";

export default {
  component: Actions,
  title: "Components/Composite/Actions",
} as Meta;

const Template: Story<{ buttons: (AppButtonProps | undefined)[] }> = ({
  buttons,
}) => (
  <Actions>
    {buttons.map((buttonProps, i) => (
      <Default key={i} {...buttonProps} />
    ))}
  </Actions>
);

export const OneButton = Template.bind({});
OneButton.args = { buttons: [Default.args] };

export const TwoButtons = Template.bind({});
TwoButtons.args = { buttons: [Default.args, Default.args] };

export const TwoButtonsMixed = Template.bind({});
TwoButtonsMixed.args = { buttons: [Outlined.args, Default.args] };
