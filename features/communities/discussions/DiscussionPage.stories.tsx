import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import comments from "test/fixtures/comments.json";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";

import DiscussionPage from "./DiscussionPage";

const [comment1, comment2, comment3, comment4, replyBase] = comments;

export default {
  component: DiscussionPage,
  title: "Communities/Discussions/DiscussionPage",
} as Meta;

interface DiscussionPageArgs {
  hasResponses?: boolean;
  shouldGetDiscussionSucceed?: boolean;
  shouldGetThreadSucceed?: boolean;
}

const Template: Story<DiscussionPageArgs> = ({
  hasResponses = true,
  shouldGetDiscussionSucceed = true,
  shouldGetThreadSucceed = true,
} = {}) => {
  setMocks({
    hasResponses,
    shouldGetDiscussionSucceed,
    shouldGetThreadSucceed,
  });
  return <DiscussionPage discussionId={2} />;
};

export const SingleDiscussion = Template.bind({});

export const DiscussionWithNoResponse = Template.bind({});
DiscussionWithNoResponse.args = {
  hasResponses: false,
};

export const ErrorLoadingDiscussion = Template.bind({});
ErrorLoadingDiscussion.args = {
  shouldGetDiscussionSucceed: false,
};

export const ErrorLoadingThread = Template.bind({});
ErrorLoadingThread.args = {
  shouldGetThreadSucceed: false,
};

function setMocks({
  hasResponses,
  shouldGetDiscussionSucceed,
  shouldGetThreadSucceed,
}: Required<DiscussionPageArgs>) {
  mockedService.communities.getCommunity = async () => community;
  mockedService.discussions.getDiscussion = async () =>
    shouldGetDiscussionSucceed
      ? discussions[0]
      : Promise.reject(new Error("Error getting discussion"));
  mockedService.threads.getThread = async (threadId, pageToken) => {
    if (shouldGetThreadSucceed) {
      if (hasResponses) {
        switch (threadId) {
          case 2:
            return {
              repliesList: pageToken
                ? [comment3, comment4]
                : [comment1, comment2],
              nextPageToken: pageToken ? "" : comment2.threadId.toString(),
            };
          case 3:
          case 4:
          case 5:
          case 6:
            return {
              repliesList: pageToken
                ? [
                    {
                      ...replyBase,
                      threadId: threadId * 3 + 1,
                      content: "Agreed!",
                    },
                  ]
                : [
                    {
                      ...replyBase,
                      threadId: threadId * 3,
                    },
                  ],
              nextPageToken: pageToken ? "" : (threadId * 3).toString(),
            };
          default:
            return { nextPageToken: "", repliesList: [] };
        }
      }
      return { nextPageToken: "", repliesList: [] };
    }
    throw new Error("Error getting thread");
  };
}
