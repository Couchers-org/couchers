import { Meta, Story } from "@storybook/react";

import users from "../../test/fixtures/users.json";
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
  user: users[0],
};
