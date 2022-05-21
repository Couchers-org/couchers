import { Meta, Story } from "@storybook/react";
import Button from "components/Button";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import { useState } from "react";

import FilterDialog from "./FilterDialog";

export default {
  component: FilterDialog,
  title: "Search/FilterDialog",
} as Meta;

const Template: Story<any> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const searchFilters = useRouteWithSearchFilters("");
  return (
    <>
      <FilterDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        searchFilters={searchFilters}
      />
      <Button onClick={() => setIsOpen(!isOpen)}>Open filter dialog</Button>
    </>
  );
};

export const filterDialog = Template.bind({});
