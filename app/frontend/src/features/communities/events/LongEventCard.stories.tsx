import { Meta, Story } from "@storybook/react";
import events from "test/fixtures/events.json";

import LongEventCard from "./LongEventCard";

export default {
  component: LongEventCard,
  title: "Communities/Events/LongEventCard",
} as Meta;

const Template: Story<{}> = () => {
  return <LongEventCard event={events[0]} />;
};

export const Event = Template.bind({});
