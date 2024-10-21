import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import events from "test/fixtures/events.json";

import CommunityLongEventCard, {
  CommunityLongEventCardProps,
} from "./CommunityLongEventCard";

export default {
  component: CommunityLongEventCard,
  title: "Communities/Events/CommunityLongEventCard",
} as Meta;

interface CommunityLongEventCardArgs extends CommunityLongEventCardProps {
  returnFullPage?: boolean;
}

const Template: Story<CommunityLongEventCardArgs> = ({
  event,
  returnFullPage = true,
}) => {
  setMocks(returnFullPage);
  return <CommunityLongEventCard event={event} />;
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
