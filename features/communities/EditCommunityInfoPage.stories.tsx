import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";

import EditCommunityInfoPage from "./EditCommunityInfoPage";

export default {
  component: EditCommunityInfoPage,
  title: "Communities/CommunityPage/EditCommunityPage",
} as Meta;

interface EditCommunityPageArgs {
  canEdit?: boolean;
  shouldInitialLoadSucceed?: boolean;
  shouldUpdatePageSucceed?: boolean;
}

const Template: Story<EditCommunityPageArgs> = ({
  canEdit = true,
  shouldInitialLoadSucceed = true,
  shouldUpdatePageSucceed = true,
} = {}) => {
  setMocks({
    canEdit,
    shouldInitialLoadSucceed: shouldInitialLoadSucceed,
    shouldUpdatePageSucceed,
  });
  return <EditCommunityInfoPage />;
};

export const EditCommunity = Template.bind({});

export const NoPermission = Template.bind({});
NoPermission.args = {
  canEdit: false,
};

export const ErrorUpdatingPage = Template.bind({});
ErrorUpdatingPage.args = {
  shouldUpdatePageSucceed: false,
};

function setMocks({
  canEdit,
  shouldInitialLoadSucceed,
  shouldUpdatePageSucceed,
}: Required<EditCommunityPageArgs>) {
  mockedService.communities.getCommunity = async () =>
    shouldInitialLoadSucceed
      ? {
          ...community,
          mainPage: {
            ...community.mainPage,
            canEdit,
          },
        }
      : Promise.reject(new Error("Error getting community"));
  mockedService.pages.updatePage = async ({ content }) =>
    shouldUpdatePageSucceed
      ? {
          ...community.mainPage,
          canEdit,
          content: content || community.mainPage.content,
        }
      : Promise.reject(new Error("Error updating community info page"));
}
