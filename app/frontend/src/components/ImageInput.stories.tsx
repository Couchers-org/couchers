import { Meta, Story } from "@storybook/react";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";
import { mockedService } from "stories/__mocks__/service";

import ImageInput from "./ImageInput";
import Button from "./Button";

export default {
  component: ImageInput,
  title: "Components/Composite/ImageInput",
} as Meta;

const Template: Story<any> = (args) => {
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
      <div style={{ width: 300, height: 150 }}>
        <ImageInput
          id="image-input"
          name="imageInput"
          control={control}
          type="square"
          {...args}
        />
      </div>
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};

export const imageInput = Template.bind({});

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
