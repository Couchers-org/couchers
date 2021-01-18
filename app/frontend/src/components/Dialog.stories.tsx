// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { DialogActions } from "@material-ui/core";
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";

import { Dialog, DialogContentText, DialogTitle } from "./Dialog";
import Button from "./Button";
// @ts-ignore

export default {
  title: "Components/Dialog",
  component: Dialog,
} as Meta;

const Template: Story<any> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open dialog</Button>
      <Dialog {...args} open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Example dialog</DialogTitle>
        <DialogContentText>
          Here is some dialog text. Dialog often contains text and one or more
          action buttons. So handy!
        </DialogContentText>
        <DialogActions>
          <Button>Action 1</Button>
          <Button>Action 2</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const Simple = Template.bind({});
Simple.args = {};
