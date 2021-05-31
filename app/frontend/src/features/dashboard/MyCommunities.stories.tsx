import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";

import MyCommunities from "./MyCommunities";

export default {
  component: MyCommunities,
  title: "Dashboard/MyCommunities",
} as Meta;

interface MyCommunitiesArgs {
  shouldSucceed?: boolean;
  hasMore?: boolean;
}

const Template: Story<MyCommunitiesArgs> = ({
  shouldSucceed = true,
  hasMore = false,
} = {}) => {
  setMocks({ shouldSucceed, hasMore });
  return <MyCommunities />;
};

export const myCommunities = Template.bind({});

export const withMore = Template.bind({});
withMore.args = { hasMore: true };

export const error = Template.bind({});
error.args = { shouldSucceed: false };

function setMocks({ shouldSucceed, hasMore }: Required<MyCommunitiesArgs>) {
  mockedService.communities.listUserCommunities = async () =>
    shouldSucceed
      ? {
          communitiesList: [community],
          nextPageToken: hasMore ? "more" : "",
        }
      : Promise.reject(new Error("Error listing communities"));
}
