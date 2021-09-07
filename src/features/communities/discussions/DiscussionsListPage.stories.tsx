import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";

import DiscussionsListPage from "./DiscussionsListPage";

export default {
  component: DiscussionsListPage,
  title: "Communities/Discussions/DiscussionsListPage",
} as Meta;

interface DiscussionsListArgs {
  shouldSucceed?: boolean;
}

const Template: Story<DiscussionsListArgs> = ({
  shouldSucceed = true,
} = {}) => {
  setMocks({ shouldSucceed });
  return <DiscussionsListPage community={community} />;
};

export const DiscussionsList = Template.bind({});

export const ErrorListingDiscussions = Template.bind({});
ErrorListingDiscussions.args = { shouldSucceed: false };

function setMocks({ shouldSucceed }: Required<DiscussionsListArgs>) {
  mockedService.communities.listDiscussions = async () =>
    shouldSucceed
      ? {
          discussionsList: discussions,
          nextPageToken: "",
        }
      : Promise.reject(new Error("Error listing discussions"));
}
