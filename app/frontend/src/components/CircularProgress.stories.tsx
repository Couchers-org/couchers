import { Meta, Story } from "@storybook/react";

import CircularProgress from "./CircularProgress";

export default {
  title: "Components/Simple/CircularProgress",
  component: CircularProgress,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <CircularProgress {...args} />
  </>
);

export const circularProgress = Template.bind({});
