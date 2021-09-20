import { TabContext } from "@material-ui/lab";
import { Meta, Story } from "@storybook/react";
import { useState } from "react";

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

type Labels = Partial<typeof labels>;

const Template: Story<TabBarProps<Labels> & { value: keyof typeof labels }> = (
  args
) => {
  const [currentTab, setCurrentTab] = useState(args.value);
  return (
    <TabContext value={currentTab}>
      <TabBar {...args} setValue={setCurrentTab} />
    </TabContext>
  );
};

export const SimpleLabel = Template.bind({});
SimpleLabel.args = {
  labels: {
    meet: "Meet",
    surfing: "Surfing",
  },
  value: "meet",
};

export const LabelWithBadge = Template.bind({});
LabelWithBadge.args = {
  labels: {
    all: <NotificationBadge count={10}>All</NotificationBadge>,
    surfing: "Surfing",
  },
  value: "all",
};

export const HighCountBadge = Template.bind(null);
HighCountBadge.args = {
  labels: {
    all: <NotificationBadge count={100}>All</NotificationBadge>,
    surfing: "Surfing",
  },
  value: "all",
};
