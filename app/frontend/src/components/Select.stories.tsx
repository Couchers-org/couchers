import { Meta, Story } from "@storybook/react";

import Select from "./Select";

export default {
  component: Select,
  title: "Components/Simple/Select",
} as Meta;

const Template: Story<{ options: string[] }> = ({ options }) => (
  <Select id="story-select">
    {options.map((o) => (
      <option value={o}>{o}</option>
    ))}
  </Select>
);

export const Default = Template.bind({});
Default.args = {
  options: ["foo bar", "lorem", "ipsum"],
};

const WithDataTemplate: Story<{
  options: (1 | 2 | 3 | 4)[];
  value: 1 | 2 | 3 | 4;
}> = ({ options, value }) => (
  <Select
    id="story-select-with-data"
    data={{
      1: "label for value 1",
      2: "label for value 2",
      3: "label for value 3",
      4: "label for value 4",
    }}
    defaultValue={value}
    options={options}
  ></Select>
);

export const WithData = WithDataTemplate.bind({});
WithData.args = {
  options: [1, 3, 4],
  value: 3,
};
