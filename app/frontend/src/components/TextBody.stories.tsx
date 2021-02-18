import { Meta, Story } from "@storybook/react";

import TextBody from "./TextBody";

export default {
  title: "Components/Simple/TextBody",
  component: TextBody,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <TextBody>{args.text}</TextBody>
  </>
);

export const textBody = Template.bind({});
textBody.args = { text: "This is test body text." };
