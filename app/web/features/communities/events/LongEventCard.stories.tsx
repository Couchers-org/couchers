import { ThemeProvider } from "@material-ui/core/styles";
import { Meta, Story } from "@storybook/react";
import { Event } from "proto/events_pb";
import React from "react";
import mockEvents from "test/fixtures/events.json";
import { theme } from "theme";

import LongEventCard from "./LongEventCard";

export default {
  title: "Communities/Events/LongEventCard",
  component: LongEventCard,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
} as Meta;

const Template: Story<{ event: Event.AsObject; userId: number | null }> = (
  args
) => <LongEventCard {...args} />;

export const DefaultLongEventCard = Template.bind({});
DefaultLongEventCard.args = {
  event: mockEvents[0],
  userId: 123,
};

export const OnlineEvent = Template.bind({});
OnlineEvent.args = {
  event: mockEvents[1],
  userId: 123,
};

export const CancelledEvent = Template.bind({});
CancelledEvent.args = {
  event: mockEvents[3],
  userId: 123,
};
