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
