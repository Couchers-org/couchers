// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";

import Button from "./Button";
// @ts-ignore

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <div>
      <Button {...args}>Click</Button>
    </div>
    <div>
      <Button {...args}>Longer text button</Button>
    </div>
    <div>
      <Button {...args} variant="contained">
        Click
      </Button>
    </div>
    <div>
      <Button {...args} variant="contained">
        Longer text button
      </Button>
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
