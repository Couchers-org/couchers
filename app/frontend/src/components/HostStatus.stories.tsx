import { Meta, Story } from "@storybook/react";

import { HostingStatus, User } from "../pb/api_pb";
import HostStatus from "./HostStatus";

export default {
  title: "Components/Large/HostStatus",
  component: HostStatus,
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
    <HostStatus user={{ hostingStatus: args.hostingStatus } as User.AsObject} />
  </>
);

export const hostStatus = Template.bind({});
hostStatus.args = {
  hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
};
