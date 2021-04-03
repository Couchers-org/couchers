import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Button from "./Button";

export default {
  component: Button,
  title: "Components/Simple/Button",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <Button {...args}>Click</Button>
    <Button {...args}>Ok</Button>
    <Button {...args}>Longer label button</Button>
    <Button {...args} variant="text">
      Text button
    </Button>
    <Button {...args} variant="outline">
      Outline button
    </Button>
  </>
);

function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

export const Simple = Template.bind({});
Simple.args = {};

export const Loading = Template.bind({});
Loading.args = { loading: true };

export const AsyncOnClick = Template.bind({});
AsyncOnClick.args = { onClick: () => wait(1e3) };
