import { Meta, Story } from "@storybook/react";

import { hostingStatusLabels } from "../features/profile/constants";
import { HostingStatus, User } from "../pb/api_pb";
import { CouchIcon } from "./Icons";
import IconText from "./IconText";

export default {
  title: "Components/Composite/IconText",
  component: IconText,
  argTypes: {
    hostingStatus: {
      control: {
        type: "select",
        options: Object.keys(HostingStatus).map(
          (key) => (HostingStatus as any)[key]
        ),
      },
    },
  },
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
