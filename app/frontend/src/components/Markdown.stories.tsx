import { Meta, Story } from "@storybook/react";

import Markdown from "./Markdown";

export default {
  component: Markdown,
  title: "Components/Simple/Markdown",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <Markdown {...args} />
  </>
);

export const markdown = Template.bind({});
markdown.args = {
  source: "# Test markdown\n\nThis is a *markdown* **test**.",
};
