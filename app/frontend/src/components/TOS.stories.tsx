import { Meta, Story } from "@storybook/react";

import TOS from "./TOS";

export default {
  title: "Components/Composite/TOS",
  component: TOS,
} as Meta;

const Template: Story<any> = () => (
  <>
    <TOS />
  </>
);

export const tOS = Template.bind({});
