import { Meta, Story } from "@storybook/react";
import { HostRequestStatus } from "couchers-core/src/proto/conversations_pb";
import { HostRequest } from "couchers-core/src/proto/requests_pb";
import HostRequestStatusIcon from "features/messages/requests/HostRequestStatusIcon";

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
