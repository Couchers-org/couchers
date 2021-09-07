import { Button } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Menu, { MenuItem } from "./Menu";

export default {
  component: Menu,
  title: "Components/Composite/Menu",
} as Meta;

const Template: Story<any> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuAnchor = React.useRef<HTMLAnchorElement>(null);
  return (
    <>
      <Button onClick={() => setIsOpen(true)} innerRef={menuAnchor}>
        Open Menu
      </Button>
      <Menu
        {...args}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        anchorEl={menuAnchor}
      >
        <MenuItem onClick={() => null}>Example 1</MenuItem>
        <MenuItem onClick={() => null}>Example 2</MenuItem>
        <MenuItem onClick={() => null}>Example 3</MenuItem>
      </Menu>
    </>
  );
};

export const Simple = Template.bind({});
Simple.args = {};
