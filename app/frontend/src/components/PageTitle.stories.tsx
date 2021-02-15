import { Meta, Story } from "@storybook/react";

import PageTitle from "./PageTitle";

export default {
  title: "Components/Small/PageTitle",
  component: PageTitle,
} as Meta;

const Template: Story<any> = () => (
  <>
    <PageTitle>Profile Page</PageTitle>
  </>
);

export const pageTitle = Template.bind({});
