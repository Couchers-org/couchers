import { Meta, Story } from "@storybook/react";

import SearchBox from "./SearchBox";

export default {
  title: "Components/Large/SearchBox",
  component: SearchBox,
} as Meta;

const Template: Story<any> = () => (
  <>
    <SearchBox />
  </>
);

export const searchBox = Template.bind({});
