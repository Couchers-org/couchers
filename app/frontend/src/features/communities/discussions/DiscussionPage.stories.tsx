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
  mockedService.threads.getThread = async () =>
    shouldGetThreadSucceed
      ? hasResponses
        ? threadRes
        : { ...threadRes, repliesList: [] }
      : Promise.reject(new Error("Error getting thread"));
}
