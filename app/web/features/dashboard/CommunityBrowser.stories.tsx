import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";

import CommunityBrowser from "./CommunityBrowser";

export default {
  component: CommunityBrowser,
  title: "Dashboard/CommunityBrowser",
} as Meta;

interface CommunityBrowserArgs {
  shouldSucceed?: boolean;
  hasMore?: boolean;
}

const Template: Story<CommunityBrowserArgs> = ({
  shouldSucceed = true,
  hasMore = false,
} = {}) => {
  setMocks({ shouldSucceed, hasMore });
  return <CommunityBrowser />;
};

export const myCommunities = Template.bind({});

export const withMore = Template.bind({});
withMore.args = { hasMore: true };

export const error = Template.bind({});
error.args = { shouldSucceed: false };

function setMocks({ shouldSucceed, hasMore }: Required<CommunityBrowserArgs>) {
  const listMock = async (id: number) =>
    shouldSucceed
      ? {
          communitiesList:
            id === 123
              ? []
              : [community, { ...community, name: "Paris", communityId: 123 }],
          nextPageToken: hasMore ? "more" : "",
        }
      : Promise.reject(new Error("Error listing communities"));
  const singleMock = async () =>
    shouldSucceed
      ? { ...community, name: "Global", communityId: 1 }
      : Promise.reject(new Error("Couldn't get community."));
  mockedService.communities.listCommunities = listMock;
  mockedService.communities.getCommunity = singleMock;
}
