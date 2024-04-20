import { Meta, Story } from "@storybook/react";
import React from "react";

import Button from "./Button";
import ConfirmationDialogWrapper from "./ConfirmationDialogWrapper";

export default {
  argTypes: {
    onConfirm: { action: "confirmed" },
  },
  component: ConfirmationDialogWrapper,
  title: "Components/Composite/ConfirmationDialogWrapper",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <ConfirmationDialogWrapper
      title="Are you sure?"
      message={
        `Are you sure you want to perform ` +
        `this action? You will not be able to undo ` +
        `it.`
      }
      onConfirm={args.onConfirm}
    >
      {(setIsOpen) => (
        <Button onClick={() => setIsOpen(true)}>Test action</Button>
      )}
    </ConfirmationDialogWrapper>
  </>
);

export const confirmationDialogWrapper = Template.bind({});
