import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";

import CommunitiesList from "./CommunitiesList";

export default {
  component: CommunitiesList,
  title: "Dashboard/CommunitiesList",
} as Meta;

interface CommunitiesListArgs {
  shouldSucceed?: boolean;
  hasMore?: boolean;
}

const Template: Story<CommunitiesListArgs> = ({
  shouldSucceed = true,
  hasMore = false,
} = {}) => {
  setMocks({ shouldSucceed, hasMore });
  return <CommunitiesList />;
};

export const myCommunities = Template.bind({});

export const withMore = Template.bind({});
withMore.args = { hasMore: true };

export const error = Template.bind({});
error.args = { shouldSucceed: false };

function setMocks({ shouldSucceed, hasMore }: Required<CommunitiesListArgs>) {
  const mock = async () =>
    shouldSucceed
      ? {
          communitiesList: [community],
          nextPageToken: hasMore ? "more" : "",
        }
      : Promise.reject(new Error("Error listing communities"));
  mockedService.communities.listUserCommunities = mock;
  mockedService.communities.listCommunities = mock;
}
