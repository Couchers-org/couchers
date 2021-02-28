import { Meta, Story } from "@storybook/react";

import Pill, { PillProps } from "./Pill";

export default {
  title: "Components/Simple/Pill",
  component: Pill,
  decorators: [
    (Story) => (
      <div style={{ width: "100px" }}>
        <Story />
      </div>
    ),
  ],
} as Meta;

export const pill: Story<PillProps> = (args) => <Pill {...args} />;
pill.args = {
  children: "Hosting",
};
