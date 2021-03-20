import { Meta, Story } from "@storybook/react";
import HostRequestStatusIcon from "features/messages/surfing/HostRequestStatusIcon";
import { HostRequestStatus } from "pb/conversations_pb";
import { HostRequest } from "pb/requests_pb";

export default {
  argTypes: {
    requestStatus: {
      control: {
        options: Object.keys(HostRequestStatus).map(
          (key) => (HostRequestStatus as any)[key]
        ),
        type: "select",
      },
    },
  },
  component: HostRequestStatusIcon,
  title: "Messages/HostRequestStatusIcon",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <HostRequestStatusIcon
      hostRequest={{ status: args.requestStatus } as HostRequest.AsObject}
    />
  </>
);

export const hostRequestStatusIcon = Template.bind({});
hostRequestStatusIcon.args = {
  requestStatus: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
};
