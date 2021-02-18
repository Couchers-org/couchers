import { Meta, Story } from "@storybook/react";

import Alert from "./Alert";

export default {
  title: "Components/Simple/Alert",
  component: Alert,
  argTypes: {
    severity: {
      control: {
        type: "select",
        options: ["error", "info", "warning", "success"],
      },
    },
  },
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <Alert {...args}>This is an alert</Alert>
  </>
);

export const alert = Template.bind({});
alert.args = { severity: "error" };
