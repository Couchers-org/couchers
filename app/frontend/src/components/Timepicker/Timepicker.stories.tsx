import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";

import Timepicker from "./Timepicker";

export default {
  component: Timepicker,
  title: "Components/Simple/Timepicker",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, register } = useForm();
  return (
    <Timepicker
      control={control}
      error={false}
      helperText=""
      id="time-field"
      inputRef={register}
      label="Time field"
      name="timeField"
      {...args}
    />
  );
};

export const Simple = Template.bind({});
