import React from "react";
import { Meta, Story } from "@storybook/react";
import { CouchIcon } from "./Icons";

import IconButton from "./IconButton";

export default {
  title: "Components/IconButton",
  component: IconButton,
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
