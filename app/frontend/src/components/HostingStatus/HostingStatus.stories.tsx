import { Meta, Story } from "@storybook/react";
import HostingStatus, {
  HostingStatusProps,
} from "components/HostingStatus/HostingStatus";
import { HostingStatus as THostingStatus } from "pb/api_pb";

export default {
  argTypes: {
    hostingStatus: {
      control: {
        options: Object.values(THostingStatus),
        type: "select",
      },
      defaultValue: THostingStatus.HOSTING_STATUS_CANT_HOST,
    },
  },
  component: HostingStatus,
  title: "Components/Composite/HostingStatus",
} as Meta;

export const Status: Story<HostingStatusProps> = (args) => (
  <HostingStatus {...args} />
);
