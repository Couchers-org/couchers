import { Meta, Story } from "@storybook/react";

import TextBody from "./TextBody";

export default {
  component: TextBody,
  title: "Components/Simple/TextBody",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <TextBody>{args.text}</TextBody>
  </>
);

export const textBody = Template.bind({});
textBody.args = { text: "This is test body text." };
