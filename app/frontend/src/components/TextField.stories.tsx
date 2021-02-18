import { Meta, Story } from "@storybook/react";

import TextField from "./TextField";

export default {
  title: "Components/Simple/TextField",
  component: TextField,
} as Meta;

const Template: Story<any> = () => (
  <>
    <TextField id="test-field" label="Test field" />
  </>
);

export const textField = Template.bind({});
