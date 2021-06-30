import { Meta, Story } from "@storybook/react";
import events from "test/fixtures/events.json";

import EventCard, { EventCardProps } from "./EventCard";

export default {
  component: EventCard,
  title: "Communities/CommunityPage/EventCard",
} as Meta;

const Template: Story<EventCardProps> = (args) => <EventCard {...args} />;

export const eventCard = Template.bind({});
eventCard.args = {
  event: events[0],
};
