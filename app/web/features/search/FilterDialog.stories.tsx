import { Meta, Story } from "@storybook/react";
import Button from "components/Button";
import { useState } from "react";

import FilterDialog from "./FilterDialog";

export default {
  component: FilterDialog,
  title: "Search/FilterDialog",
} as Meta;

const Template: Story<any> = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FilterDialog
        setLocationResult={() => {}}
        lastActiveFilter={0}
        setQueryName={() => {}}
        queryName=""
        setLastActiveFilter={() => {}}
        hostingStatusFilter={[3]}
        setHostingStatusFilter={() => {}}
        completeProfileFilter={true}
        setCompleteProfileFilter={() => {}}
        numberOfGuestFilter={undefined}
        setNumberOfGuestFilter={() => {}}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <Button onClick={() => setIsOpen(!isOpen)}>Open filter dialog</Button>
    </>
  );
};

export const filterDialog = Template.bind({});
