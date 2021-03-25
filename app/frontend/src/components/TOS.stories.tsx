import { Meta, Story } from "@storybook/react";

import TOS from "./TOS";

export default {
  component: TOS,
  title: "Components/Composite/TOS",
} as Meta;

const Template: Story<any> = () => (
  <>
    <TOS />
  </>
);

export const tOS = Template.bind({});
