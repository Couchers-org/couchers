import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";

import JoinCommunityButton from "./JoinCommunityButton";

export default {
  component: JoinCommunityButton,
  title: "Communities/CommunityPage/JoinCommunityButton",
} as Meta;

const Template: Story<{ succeed: boolean; joined: boolean }> = (args) => {
  setMocks(args.succeed);
  return (
    <JoinCommunityButton community={{ ...community, member: args.joined }} />
  );
};

export const isMember = Template.bind({});
isMember.args = { succeed: true, joined: true };
export const notMember = Template.bind({});
notMember.args = { succeed: true, joined: false };
export const withError = Template.bind({});
withError.args = { succeed: false };

function setMocks(shouldSucceed: boolean) {
  mockedService.communities.joinCommunity = async () => {
    if (!shouldSucceed) throw Error("Didn't work.");
  };
  mockedService.communities.leaveCommunity = async () => {
    if (!shouldSucceed) throw Error("Didn't work.");
  };
}
