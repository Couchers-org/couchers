import { Meta, Story } from "@storybook/react";
import Button from "components/Button";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import { useForm } from "react-hook-form";

export default {
  component: ProfileMarkdownInput,
  title: "Profile/ProfileMarkdownInput",
} as Meta;

const Template: Story<any> = (args) => {
  const { control, handleSubmit } = useForm();
  return (
    <>
      <ProfileMarkdownInput
        name="markdownInput"
        control={control}
        id="md-input"
        label="Profile md input"
        {...args}
      />
      <Button onClick={handleSubmit(console.log)} type="submit">
        Submit
      </Button>
    </>
  );
};

export const profileMarkdownInput = Template.bind({});
profileMarkdownInput.args = {
  label: "Markdown input",
};
