import { Meta, Story } from "@storybook/react";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import { HostingStatus } from "proto/api_pb";

export default {
  argTypes: {
    hostingStatus: {
      control: {
        options: Object.keys(HostingStatus).map(
          (key) => (HostingStatus as any)[key]
        ),
        type: "select",
      },
    },
  },
  component: IconText,
  title: "Components/Composite/IconText",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <IconText icon={CouchIcon} text={args.exampleText} />
  </>
);

export const iconText = Template.bind({});
iconText.args = {
  exampleText: "Example text",
};
