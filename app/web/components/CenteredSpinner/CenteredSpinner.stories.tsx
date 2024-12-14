import { Meta, Story } from "@storybook/react";

import CenteredSpinner from "./CenteredSpinner";

export default {
  component: CenteredSpinner,
  title: "Components/Simple/CenteredSpinner",
} as Meta;

export const Loader: Story<Record<string, never>> = () => <CenteredSpinner />;
