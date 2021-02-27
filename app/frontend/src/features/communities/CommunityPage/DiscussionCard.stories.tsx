import { Meta, Story } from "@storybook/react";

import discussion from "../../../test/fixtures/discussion.json";
import DiscussionCard from "./DiscussionCard";

export default {
  title: "Communities/CommunityPage/DiscussionCard",
  component: DiscussionCard,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <DiscussionCard {...args} />
  </>
);

export const discussionCard = Template.bind({});
discussionCard.args = {
  discussion,
};
