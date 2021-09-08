import { Meta, Story } from "@storybook/react";

import Select from "./Select";

export default {
  component: Select,
  title: "Components/Simple/Select",
} as Meta;

const Template: Story<{
  options: (1 | 2 | 3 | 4)[];
  value: 1 | 2 | 3 | 4;
}> = ({ options, value }) => (
  <Select
    id="story-select-with-data"
    optionLabelMap={{
      1: "label for value 1",
      2: "label for value 2",
      3: "label for value 3",
      4: "label for value 4",
    }}
    defaultValue={value}
    options={options}
  ></Select>
);

export const Default = Template.bind({});
Default.args = {
  options: [1, 3, 4],
  value: 3,
};
