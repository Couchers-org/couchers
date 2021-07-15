import { Meta, Story } from "@storybook/react";

import CommunityGuidelinesSection from "./CommunityGuidelinesSection";

export default {
  component: CommunityGuidelinesSection,
  title: "Auth/Jail/CommunityGuidelinesSection",
} as Meta;

const Template: Story<any> = (args) => <CommunityGuidelinesSection {...args} />;

export const communityGuidelinesSection = Template.bind({});
