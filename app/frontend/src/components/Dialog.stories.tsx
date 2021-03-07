import { DialogActions } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Button from "./Button";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "./Dialog";

export default {
  component: Dialog,
  title: "Components/Composite/Dialog",
} as Meta;

const Template: Story<any> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open dialog</Button>
      <Dialog {...args} open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Example dialog</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Here is some dialog text. Dialog often contains text and one or more
            action buttons. So handy!
          </DialogContentText>
        </DialogContent>
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
