import { Meta, Story } from "@storybook/react";
import SearchBox from "features/search/SearchBox";

export default {
  component: SearchBox,
  title: "Search/SearchBox",
} as Meta;

const Template: Story<any> = () => {
  return (
    <>
      <SearchBox
        searchType={"keyword"}
        setSearchType={() => {}}
        locationResult={undefined}
        setLocationResult={() => {}}
        setQueryName={() => {}}
        queryName={""}
      />
    </>
  );
};

export const searchBox = Template.bind({});
