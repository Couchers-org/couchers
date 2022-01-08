import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";

import Datepicker from "./Datepicker";

export default {
  component: Datepicker,
  title: "Components/Simple/Datepicker",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, register } = useForm();
  return (
    <Datepicker
      control={control}
      error={false}
      helperText=""
      id="date-field"
      inputRef={register}
      label="Date field"
      name="datefield"
      {...args}
    />
  );
};
export const Simple = Template.bind({});
