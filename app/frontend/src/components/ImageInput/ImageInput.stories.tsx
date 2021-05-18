import { Meta, Story } from "@storybook/react";
import Button from "components/Button";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";
import { mockedService } from "stories/serviceMocks";

import ImageInput from "./ImageInput";

export default {
  component: ImageInput,
  title: "Components/Composite/ImageInput",
} as Meta;

const AvatarTemplate: Story<any> = (args) => {
  setMocks();
  const { control, handleSubmit } = useForm();
  return (
    <>
      <ImageInput
        id="avatar-input"
        name="avatarInput"
        control={control}
        type="avatar"
        {...args}
      />
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};

export const avatarInput = AvatarTemplate.bind({});

const ImageTemplate: Story<any> = (args) => {
  setMocks();
  const { control, handleSubmit } = useForm();
  return (
    <>
      <ImageInput
        id="image-input"
        name="imageInput"
        control={control}
        type="rect"
        {...args}
      />
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};
export const imageInput = ImageTemplate.bind({ grow: false });

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
