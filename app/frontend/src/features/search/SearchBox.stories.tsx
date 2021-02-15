import { Meta, Story } from "@storybook/react";

import SearchBox from "./SearchBox";

export default {
  title: "Search/SearchBox",
  component: SearchBox,
} as Meta;

const Template: Story<any> = () => (
  <>
    <SearchBox />
  </>
);

export const searchBox = Template.bind({});
