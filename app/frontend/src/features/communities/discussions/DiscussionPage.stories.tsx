import { Meta, Story } from "@storybook/react";
import { MemoryRouter, Route } from "react-router-dom";
import { discussionBaseRoute, discussionRoute } from "routes";
import { mockedService } from "stories/serviceMocks";
import discussions from "test/fixtures/discussions.json";
import threadRes from "test/fixtures/getThreadRes.json";

import DiscussionPage from "./DiscussionPage";

export default {
  component: DiscussionPage,
  decorators: [
    (Story) => (
      <MemoryRouter
        initialEntries={[
          `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`,
        ]}
      >
        <Route path={discussionRoute}>
          <Story />
        </Route>
      </MemoryRouter>
    ),
  ],
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
  return <DiscussionPage />;
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
  mockedService.discussions.getDiscussion = async () =>
    shouldGetDiscussionSucceed
      ? discussions[0]
      : Promise.reject(new Error("Error getting discussion"));
  mockedService.threads.getThread = async (threadId) => {
    if (shouldGetThreadSucceed) {
      if (hasResponses) {
        switch (threadId) {
          case 2:
            return threadRes;
          case 3:
          case 4:
          case 5:
          case 6:
            return {
              ...threadRes,
              repliesList: [
                {
                  threadId: threadId * 3,
                  content: "I know right?",
                  authorUserId: 3,
                  createdTime: { seconds: 1577920000, nanos: 0 },
                  numReplies: 0,
                },
              ],
            };
          default:
            return { ...threadRes, repliesList: [] };
        }
      }
      return { ...threadRes, repliesList: [] };
    }
    throw new Error("Error getting thread");
  };
}
