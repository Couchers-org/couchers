import { Meta, Story } from "@storybook/react";

import { HostRequestStatus } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import HostRequestStatusIcon from "./HostRequestStatusIcon";

export default {
  title: "Messages/HostRequestStatusIcon",
  component: HostRequestStatusIcon,
  argTypes: {
    requestStatus: {
      control: {
        type: "select",
        options: Object.keys(HostRequestStatus).map(
          (key) => (HostRequestStatus as any)[key]
        ),
      },
    },
  },
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
