import { Meta, Story } from "@storybook/react";

import community from "../../../test/fixtures/community.json";
import HeaderImage from "./HeaderImage";

export default {
  title: "Communities/CommunityPage/HeaderImage",
  component: HeaderImage,
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
