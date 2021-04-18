import { Meta, Story } from "@storybook/react";
import DiscussionCard from "features/communities/CommunityPage/DiscussionCard";
import discussions from "test/fixtures/discussions.json";

export default {
  component: DiscussionCard,
  title: "Communities/CommunityPage/DiscussionCard",
} as Meta;

const Template: Story<any> = (args) => <DiscussionCard {...args} />;

export const discussionCard = Template.bind({});
discussionCard.args = {
  discussions,
};
