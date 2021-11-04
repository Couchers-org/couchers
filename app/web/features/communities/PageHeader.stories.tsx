import { Meta, Story } from "@storybook/react";
import { ComponentProps } from "react";
import community from "test/fixtures/community.json";

import PageHeader from "./PageHeader";

export default {
  component: PageHeader,
  title: "Communities/PageHeader",
} as Meta;

const Template: Story<ComponentProps<typeof PageHeader>> = (args) => (
  <PageHeader {...args} />
);

export const pageHeader = Template.bind({});
pageHeader.args = {
  page: community.mainPage,
};
