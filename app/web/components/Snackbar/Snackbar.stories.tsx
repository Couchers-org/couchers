import { Meta, Story } from "@storybook/react";

import Snackbar, { SnackbarProps } from "./Snackbar";

export default {
  component: Snackbar,
  decorators: [
    (Story) => (
      <div style={{ width: "100px" }}>
        <Story />
      </div>
    ),
  ],
  title: "Components/Composite/Snackbar",
} as Meta;

export const snackbar: Story<SnackbarProps> = (args) => <Snackbar {...args} />;

snackbar.args = {
  children: "Funny Dog has been reported to the Couchers safety team",
};
