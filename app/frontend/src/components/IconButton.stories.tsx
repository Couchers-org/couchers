import { Meta, Story } from "@storybook/react";
import React from "react";

import IconButton from "./IconButton";
import { CouchIcon } from "./Icons";

export default {
  component: IconButton,
  title: "Components/Simple/IconButton",
} as Meta;

const Template: Story<any> = (args) => {
  const [loading, setLoading] = React.useState(false);
  return (
    <>
      <IconButton
        {...args}
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        <CouchIcon />
      </IconButton>
    </>
  );
};

export const Simple = Template.bind({});
Simple.args = {};

export const Small = Template.bind({});
Small.args = {
  size: "small",
};
