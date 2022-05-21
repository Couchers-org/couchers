import { Meta, Story } from "@storybook/react";
import SearchBox from "features/search/SearchBox";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";

export default {
  component: SearchBox,
  title: "Search/SearchBox",
} as Meta;

const Template: Story<any> = () => {
  const searchFilters = useRouteWithSearchFilters("");
  return (
    <>
      <SearchBox searchFilters={searchFilters} />
    </>
  );
};

export const searchBox = Template.bind({});
