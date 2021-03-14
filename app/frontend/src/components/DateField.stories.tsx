import { Meta, Story } from "@storybook/react";
import * as React from "react";

import DateField from "./DateField";

export default {
  component: DateField,
  title: "Components/Simple/DateField",
} as Meta;

const Template: Story<any> = (args) => (
    <>
      <DateField {...args} />
    </>
  );
  
  export const circularProgress = Template.bind({});