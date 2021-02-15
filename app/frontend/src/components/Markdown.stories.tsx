import { Meta, Story } from "@storybook/react";

import Markdown from "./Markdown";

export default {
  title: "Components/Small/Markdown",
  component: Markdown,
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
