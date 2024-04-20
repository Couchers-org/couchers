import { Meta, Story } from "@storybook/react";
import Button from "components/Button";
import { useForm } from "react-hook-form";

import MarkdownInput from ".";

export default {
  component: MarkdownInput,
  title: "Components/Composite/MarkdownInput",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, handleSubmit } = useForm();
  return (
    <>
      <span id="md-input-label">Markdown input</span>
      <MarkdownInput
        name="markdownInput"
        control={control}
        id="md-input"
        labelId="md-input-label"
        {...args}
      />
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};

export const markdownInput = Template.bind({});
