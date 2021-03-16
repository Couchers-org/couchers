import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";

import DateField from "./DateField";

export default {
  component: DateField,
  title: "Components/Simple/DateField",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, register } = useForm();
  return (
    <DateField
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
