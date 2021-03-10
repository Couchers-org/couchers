import { Meta, Story } from "@storybook/react";
import React from "react";

import NotificationBadge from "../NotificationBadge";
import TabBar, { TabBarProps } from "./TabBar";

export default {
  component: TabBar,
  title: "Components/Composite/TabBar",
} as Meta;

const labels = {
  all: <></>,
  archived: "Archived",
  meet: "Meet",
  surfing: "Surfing",
};

type PartialLabels = Partial<typeof labels>;

const Template: Story<TabBarProps<PartialLabels>> = (args) => (
  <TabBar {...args} />
);

export const SimpleLabel = Template.bind({});
SimpleLabel.args = {
  labels: {
    meet: "Meet",
    surfing: "Surfing",
  },
  setValue: () => {},
  value: "meet",
};

export const LabelWithBadge = Template.bind({});
LabelWithBadge.args = {
  labels: {
    all: <NotificationBadge count={10}>All</NotificationBadge>,
    surfing: "Surfing",
  },
  setValue: () => {},
  value: "all",
};

export const HighCountBadge = Template.bind(null);
HighCountBadge.args = {
  labels: {
    all: <NotificationBadge count={100}>All</NotificationBadge>,
    surfing: "Surfing",
  },
  setValue: () => {},
  value: "all",
};
