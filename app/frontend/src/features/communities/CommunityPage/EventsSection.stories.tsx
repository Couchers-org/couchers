import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";

import EventsSection from "./EventsSection";

export default {
  component: EventsSection,
  title: "Communities/CommunityPage/EventsSection",
} as Meta;

interface EventsSectionArgs {
  hasEvents?: boolean;
  shouldSucceed?: boolean;
}

const Template: Story<EventsSectionArgs> = ({
  hasEvents = true,
  shouldSucceed = true,
} = {}) => {
  setMocks({ hasEvents, shouldSucceed });
  return <EventsSection community={community} />;
};

export const Events = Template.bind({});

export const NoEvents = Template.bind({});
NoEvents.args = {
  hasEvents: false,
};

export const ErrorListingEvents = Template.bind({});
ErrorListingEvents.args = {
  shouldSucceed: false,
};

function setMocks({ hasEvents, shouldSucceed }: Required<EventsSectionArgs>) {
  mockedService.events.listCommunityEvents = async () => {
    return shouldSucceed
      ? {
          eventsList: hasEvents ? events : [],
          nextPageToken: "",
        }
      : Promise.reject(new Error("Error listing events"));
  };
}
