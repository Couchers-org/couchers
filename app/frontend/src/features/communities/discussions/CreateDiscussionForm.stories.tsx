import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";

import CreateDiscussionForm, {
  CreateDiscussionFormProps,
} from "./CreateDiscussionForm";

export default {
  component: CreateDiscussionForm,
  title: "Communities/Discussions/CreateDiscussionForm",
  argTypes: {
    onCancel: {
      action: "cancelled",
    },
    onPost: {
      action: "post",
    },
  },
} as Meta;

interface CreateDiscussionArgs {
  shouldSucceed: boolean;
  onCancel: CreateDiscussionFormProps["onCancel"];
  onPostSuccess: CreateDiscussionFormProps["onPostSuccess"];
}

const Template: Story<CreateDiscussionArgs> = ({
  shouldSucceed,
  ...eventHandlerProps
}) => {
  setMocks({ shouldSucceed });
  return <CreateDiscussionForm communityId={1} {...eventHandlerProps} />;
};

export const CreateDiscussion = Template.bind({});
CreateDiscussion.args = {
  shouldSucceed: true,
};

export const ErrorCreatingDiscussion = Template.bind({});
ErrorCreatingDiscussion.args = {
  shouldSucceed: false,
};

function setMocks({
  shouldSucceed,
}: Required<Pick<CreateDiscussionArgs, "shouldSucceed">>) {
  mockedService.discussions.createDiscussion = async () => {
    return shouldSucceed
      ? {
          canModerate: false,
          content: "I love the world",
          creatorUserId: 1,
          ownerCommunityId: 1,
          ownerGroupId: 0,
          title: "Hello world",
          threadId: 1,
          slug: "hello-world",
          discussionId: 1,
        }
      : Promise.reject(new Error("Error creating discussion"));
  };
}
