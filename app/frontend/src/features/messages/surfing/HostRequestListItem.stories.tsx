import { Meta, Story } from "@storybook/react";
import HostRequestListItem from "features/messages/surfing/HostRequestListItem";
import hostRequest from "test/fixtures/hostRequest.json";

export default {
  component: HostRequestListItem,
  title: "Messages/HostRequestListItem",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <HostRequestListItem {...args} />
  </>
);

export const hostRequestListItem = Template.bind({});
hostRequestListItem.args = {
  hostRequest,
};
