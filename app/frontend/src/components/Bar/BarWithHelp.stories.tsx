import { Meta, Story } from "@storybook/react";

import BarWithHelp from "./BarWithHelp";

export default {
  title: "Components/Composite/BarWithHelp",
  component: BarWithHelp,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <BarWithHelp {...args} />
  </>
);

export const barWithHelp = Template.bind({});
barWithHelp.args = {
  value: 36,
  label: "label",
  description: "some description",
};
