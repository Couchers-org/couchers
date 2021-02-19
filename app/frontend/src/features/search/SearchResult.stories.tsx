import { Meta, Story } from "@storybook/react";

import { user1 } from "../../stories/__mocks__/service";
import SearchResult from "./SearchResult";

export default {
  title: "Search/SearchResult",
  component: SearchResult,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <SearchResult {...args} />
  </>
);

export const searchResult = Template.bind({});
searchResult.args = {
  user: user1,
};
