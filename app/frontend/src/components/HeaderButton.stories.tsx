import { Meta, Story } from "@storybook/react";
import * as React from "react";

import HeaderButton from "./HeaderButton";
import { DoneIcon } from "./Icons";

export default {
  title: "Components/HeaderButton",
  component: HeaderButton,
} as Meta;

const Template: Story<any> = () => {
  return (
    <HeaderButton onClick={() => null}>
      <DoneIcon />
    </HeaderButton>
  );
};

export const Simple = Template.bind({});
