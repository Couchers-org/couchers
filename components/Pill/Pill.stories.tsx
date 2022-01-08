import { Meta, Story } from "@storybook/react";

import Pill, { PillProps } from "./Pill";

export default {
  component: Pill,
  decorators: [
    (Story) => (
      <div style={{ width: "100px" }}>
        <Story />
      </div>
    ),
  ],
  title: "Components/Simple/Pill",
} as Meta;

export const pill: Story<PillProps> = (args) => <Pill {...args} />;
pill.args = {
  children: "Hosting",
};
