import { Meta, Story } from "@storybook/react";

import CircularProgress from "./CircularProgress";

export default {
  component: CircularProgress,
  title: "Components/Simple/CircularProgress",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <CircularProgress {...args} />
  </>
);

export const circularProgress = Template.bind({});
