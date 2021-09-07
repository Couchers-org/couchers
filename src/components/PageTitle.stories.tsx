import { Meta, Story } from "@storybook/react";

import PageTitle from "./PageTitle";

export default {
  component: PageTitle,
  title: "Components/Simple/PageTitle",
} as Meta;

const Template: Story<any> = () => (
  <>
    <PageTitle>Profile Page</PageTitle>
  </>
);

export const pageTitle = Template.bind({});
