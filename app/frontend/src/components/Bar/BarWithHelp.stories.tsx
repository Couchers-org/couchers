import { Meta, Story } from "@storybook/react";

import BarWithHelp from "./BarWithHelp";

export default {
  component: BarWithHelp,
  title: "Components/Composite/BarWithHelp",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <BarWithHelp {...args} />
  </>
);

export const barWithHelp = Template.bind({});
barWithHelp.args = {
  description: "some description",
  label: "label",
  value: 36,
};
