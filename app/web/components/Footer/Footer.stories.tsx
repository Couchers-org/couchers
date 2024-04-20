import { Typography } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import AppRoute from "components/AppRoute";

import Footer from "./Footer";

export default {
  component: Footer,
  title: "Components/Composite/Footer",
} as Meta;

const Template: Story = (args) => (
  <AppRoute isPrivate={false} variant={args.variant}>
    <Typography variant="h1">Page title</Typography>
    <Typography>Page body</Typography>
  </AppRoute>
);

export const standardContainer = Template.bind({});
standardContainer.args = { variant: "standard" };
export const fullscreenContainer = Template.bind({});
fullscreenContainer.args = { variant: "full-screen" };
export const fullwidthContainer = Template.bind({});
fullwidthContainer.args = { variant: "full-width" };
