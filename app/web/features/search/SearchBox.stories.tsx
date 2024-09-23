import { Meta, Story } from "@storybook/react";
import SearchBox from "features/search/SearchBox";
import { LngLat } from "maplibre-gl";

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
        locationResult={{
          bbox: [0, 0, 0, 0],
          isRegion: false,
          location: new LngLat(0, 0),
          name: "",
          simplifiedName: "",
        }}
        setLocationResult={() => {}}
        setQueryName={() => {}}
        queryName={""}
      />
    </>
  );
};

export const searchBox = Template.bind({});
