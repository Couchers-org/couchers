import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import events from "test/fixtures/events.json";

import LongEventCard, { LongEventCardProps } from "./LongEventCard";

export default {
  component: LongEventCard,
  title: "Communities/Events/LongEventCard",
} as Meta;

interface LongEventCardArgs extends LongEventCardProps {
  returnFullPage?: boolean;
}

const Template: Story<LongEventCardArgs> = ({
  event,
  returnFullPage = true,
}) => {
  setMocks(returnFullPage);
  return <LongEventCard event={event} />;
};

export const EventWithLotsOfAttendees = Template.bind({});
EventWithLotsOfAttendees.args = {
  event: events[0],
};

export const OnlineEvent = Template.bind({});
OnlineEvent.args = {
  event: events[1],
};

export const EventWithFewAttendees = Template.bind({});
EventWithFewAttendees.args = {
  event: events[2],
  returnFullPage: false,
};

function setMocks(returnFullPage: boolean) {
  mockedService.events.listEventAttendees = async () => {
    return {
      nextPageToken: "",
      attendeeUserIdsList: returnFullPage ? [1, 2, 3, 4, 5] : [1, 2, 3],
    };
  };
}
