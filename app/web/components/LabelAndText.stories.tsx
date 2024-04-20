import { Meta, Story } from "@storybook/react";

import LabelAndText from "./LabelAndText";

export default {
  component: LabelAndText,
  title: "Components/Composite/LabelAndText",
} as Meta;

const Template: Story<any> = () => (
  <>
    <LabelAndText label="label" text="text" />
  </>
);

export const labelAndText = Template.bind({});
