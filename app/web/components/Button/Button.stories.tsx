import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Button, { AppButtonProps } from "./Button";

export default {
  component: Button,
  title: "Components/Simple/Button",
} as Meta;

const Template: Story<AppButtonProps> = (args) => (
  <>
    <Button {...args}>Click</Button>
    <Button {...args}>Ok</Button>
    <Button {...args}>Longer label button</Button>
    <Button {...args} variant="text">
      Text button
    </Button>
    <Button {...args} variant="outlined">
      Outline button
    </Button>
  </>
);

export const Default: Story<AppButtonProps> = (args) => <Button {...args} />;
Default.args = {
  children: "Click me",
  variant: "contained",
  color: "primary",
};

export const Outlined: Story<AppButtonProps> = (args) => <Button {...args} />;
Outlined.args = {
  ...Default.args,
  variant: "outlined",
};

export const Text: Story<AppButtonProps> = (args) => <Button {...args} />;
Text.args = {
  ...Default.args,
  variant: "text",
};

function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

export const Simple = Template.bind({});
Simple.args = {};

export const Loading = Template.bind({});
Loading.args = { loading: true };

export const AsyncOnClick = Template.bind({});
AsyncOnClick.args = { onClick: () => wait(1e3) };
