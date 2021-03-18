import { Meta, Story } from "@storybook/react";

import SuccessSnackbar, { SuccessSnackbarProps } from "./SuccessSnackbar";

export default {
  component: SuccessSnackbar,
  decorators: [
    (Story) => (
      <div style={{ width: "100px" }}>
        <Story />
      </div>
    ),
  ],
  title: "Components/Composite/SuccessSnackbar",
} as Meta;

export const successSnackbar: Story<SuccessSnackbarProps> = (args) => (
  <SuccessSnackbar {...args} />
);

successSnackbar.args = {
  children: "Funny Dog has been reported to the Couchers safety team",
};
