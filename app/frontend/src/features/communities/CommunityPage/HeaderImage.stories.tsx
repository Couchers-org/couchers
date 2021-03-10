import { Meta, Story } from "@storybook/react";
import HeaderImage from "features/communities/CommunityPage/HeaderImage";
import community from "test/fixtures/community.json";

export default {
  component: HeaderImage,
  title: "Communities/CommunityPage/HeaderImage",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <HeaderImage {...args} />
  </>
);

export const headerImage = Template.bind({});
headerImage.args = {
  community,
};
