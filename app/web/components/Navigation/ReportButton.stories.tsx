import { Meta, Story } from "@storybook/react";

import ReportButton from "./ReportButton";

export default {
  component: ReportButton,
  title: "Components/Simple/ReportButton",
} as Meta;

export const Loader: Story<Record<string, never>> = () => <ReportButton />;
