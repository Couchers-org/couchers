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
        searchType={""}
        setSearchType={() => {}}
        locationResult={[]}
        setLocationResult={() => {}}
        setQueryName={() => {}}
        queryName={undefined}
      />
    </>
  );
};

export const searchBox = Template.bind({});
