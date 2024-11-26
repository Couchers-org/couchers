import {
  StyledEngineProvider,
  Theme,
  ThemeProvider,
} from "@mui/material/styles";
import { Meta, Story } from "@storybook/react";
import { Event } from "proto/events_pb";
import React from "react";
import mockEvents from "test/fixtures/events.json";
import { theme } from "theme";

import LongEventCard from "./LongEventCard";

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

export default {
  title: "Communities/Events/LongEventCard",
  component: LongEventCard,
  decorators: [
    (Story) => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
      </StyledEngineProvider>
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
