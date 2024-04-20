import { Meta, Story } from "@storybook/react";

import FullPageLoader from ".";

export default {
  component: FullPageLoader,
  title: "Components/Simple/FullPageLoader",
} as Meta;

export const Loader: Story<Record<string, never>> = () => <FullPageLoader />;
