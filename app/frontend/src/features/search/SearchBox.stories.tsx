import { Meta, Story } from "@storybook/react";
import SearchBox from "features/search/SearchBox";
import useSearchFilters from "features/search/useSearchFilters";

export default {
  component: SearchBox,
  title: "Search/SearchBox",
} as Meta;

const Template: Story<any> = () => {
  const searchFilters = useSearchFilters("");
  return (
    <>
      <SearchBox searchFilters={searchFilters} />
    </>
  );
};

export const searchBox = Template.bind({});
