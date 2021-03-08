import { Meta, Story } from "@storybook/react";

import Alert from "./Alert";

export default {
  argTypes: {
    severity: {
      control: {
        options: ["error", "info", "warning", "success"],
        type: "select",
      },
    },
  },
  component: Alert,
  title: "Components/Simple/Alert",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <Alert {...args}>This is an alert</Alert>
  </>
);

export const alert = Template.bind({});
alert.args = { severity: "error" };
