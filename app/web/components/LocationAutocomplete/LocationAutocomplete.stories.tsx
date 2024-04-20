import { Meta, Story } from "@storybook/react";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import LocationAutocomplete from "./LocationAutocomplete";

export default {
  component: LocationAutocomplete,
  title: "Search/LocationAutocomplete",
  argTypes: {
    submit: {
      action: "submit",
    },
  },
} as Meta;

const Template: Story<any> = (args) => {
  const { control, handleSubmit } = useForm({ mode: "onBlur" });
  const onSubmit = handleSubmit(() =>
    args.submit(urlParams.current.toString())
  );
  const urlParams = useRef(new URLSearchParams(window.location.search));
  return (
    <form onSubmit={onSubmit}>
      <LocationAutocomplete
        {...args}
        control={control}
        name="location"
        params={urlParams.current}
      />
      <p>
        Pressing enter in the field shouldn&apos;t perform a submit action, but
        the button should.
      </p>
      <input type="submit" />
    </form>
  );
};

export const locationAutocomplete = Template.bind({});
