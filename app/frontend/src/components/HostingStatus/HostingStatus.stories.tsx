import { Meta, Story } from "@storybook/react";
import HostingStatus, {
  HostingStatusProps,
} from "components/HostingStatus/HostingStatus";
import { HostingStatus as THostingStatus } from "pb/api_pb";

export default {
  title: "Components/Composite/HostingStatus",
  component: HostingStatus,
  argTypes: {
    hostingStatus: {
      control: {
        type: "select",
        options: Object.values(THostingStatus),
      },
      defaultValue: THostingStatus.HOSTING_STATUS_CANT_HOST,
    },
  },
} as Meta;

export const Status: Story<HostingStatusProps> = (args) => (
  <HostingStatus {...args} />
);
