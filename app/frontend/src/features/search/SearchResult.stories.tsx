import { Meta, Story } from "@storybook/react";
import SearchResult from "features/search/SearchResult";
import users from "test/fixtures/users.json";

export default {
  component: SearchResult,
  title: "Search/SearchResult",
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
