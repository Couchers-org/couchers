import { Meta, Story } from "@storybook/react";
import React from "react";

import NotificationBadge from "../NotificationBadge";
import TabBar, { TabBarProps } from "./TabBar";

export default {
  title: "Components/Large/TabBar",
  component: TabBar,
} as Meta;

const labels = {
  all: <></>,
  surfing: "Surfing",
  meet: "Meet",
  archived: "Archived",
};

type PartialLabels = Partial<typeof labels>;

const Template: Story<TabBarProps<PartialLabels>> = (args) => (
  <TabBar {...args} />
);

export const SimpleLabel = Template.bind({});
SimpleLabel.args = {
  value: "meet",
  setValue: () => {},
  labels: {
    meet: "Meet",
    surfing: "Surfing",
  },
};

export const LabelWithBadge = Template.bind({});
LabelWithBadge.args = {
  value: "all",
  setValue: () => {},
  labels: {
    all: <NotificationBadge count={10}>All</NotificationBadge>,
    surfing: "Surfing",
  },
};

export const HighCountBadge = Template.bind(null);
HighCountBadge.args = {
  value: "all",
  setValue: () => {},
  labels: {
    all: <NotificationBadge count={100}>All</NotificationBadge>,
    surfing: "Surfing",
  },
};
