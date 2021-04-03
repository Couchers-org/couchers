import { Meta, Story } from "@storybook/react";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import { hostingStatusLabels } from "features/profile/constants";
import { HostingStatus, User } from "pb/api_pb";

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
    <IconText
      icon={CouchIcon}
      text={
        hostingStatusLabels[
          ({ hostingStatus: args.hostingStatus } as User.AsObject).hostingStatus
        ]
      }
    />
  </>
);

export const iconText = Template.bind({});
iconText.args = {
  hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
};
