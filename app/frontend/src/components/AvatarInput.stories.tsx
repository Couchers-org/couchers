import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";
import { mockedService } from "stories/__mocks__/service";

import AvatarInput from "./AvatarInput";
import Button from "./Button";

export default {
  component: AvatarInput,
  title: "Components/Composite/AvatarInput",
} as Meta;

const Template: Story<any> = (args) => {
  setMocks();
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

function setMocks() {
  mockedService.api.uploadFile = (file: File) =>
    Promise.resolve<ImageInputValues>({
      file,
      filename: "example.jpg",
      key: "key123",
      thumbnail_url: "https://loremflickr.com/320/240",
      full_url: "https://loremflickr.com/320/240",
    });
}
