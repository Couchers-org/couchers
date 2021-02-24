import { Meta, Story } from "@storybook/react";

import { hostRequest } from "../../../stories/__mocks__/service";
import HostRequestListItem from "./HostRequestListItem";

export default {
  title: "Messages/HostRequestListItem",
  component: HostRequestListItem,
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
