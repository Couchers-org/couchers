import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Button from "./Button";

export default {
  title: "Components/Small/Button",
  component: Button,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <div>
      <Button {...args}>Click</Button>
    </div>
    <div>
      <Button {...args}>Ok</Button>
    </div>
    <div>
      <Button {...args}>Longer text button</Button>
    </div>
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
