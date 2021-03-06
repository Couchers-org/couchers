import { Meta, Story } from "@storybook/react";
import { useEffect, useState } from "react";

import Autocomplete from "./Autocomplete";

export default {
  component: Autocomplete,
  title: "Components/Simple/Autocomplete",
} as Meta;

const Template: Story<any> = (args) => {
  const [options, setOptions] = useState<string[] | undefined>(undefined);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      setOptions(undefined);
      return;
    }
    setTimeout(() => setOptions(["Option A", "Option B", "Option C"]), 1000);
  }, [open]);
  return (
    <>
      <Autocomplete
        id="autocomplete-example"
        options={options || []}
        loading={!options}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        label="Autocomplete example"
        {...args}
      />
    </>
  );
};

export const autoomplete = Template.bind({});
