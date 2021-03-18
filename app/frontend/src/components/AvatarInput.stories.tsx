import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";

import AvatarInput from "./AvatarInput";
import Button from "./Button";

export default {
  component: AvatarInput,
  title: "Components/Compound/AvatarInput",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, handleSubmit } = useForm();
  return (
    <>
      <AvatarInput
        id="avatar-input"
        name="avatarInput"
        control={control}
        {...args}
      />
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};

export const avatarInput = Template.bind({});
