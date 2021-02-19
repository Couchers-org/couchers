import { Meta, Story } from "@storybook/react";

import TimeInterval from "./TimeInterval";

export default {
  title: "Messages/TimeInterval",
  component: TimeInterval,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <TimeInterval {...args} />
  </>
);

export const timeInterval = Template.bind({});
timeInterval.args = {
  date: Date.now(),
};
