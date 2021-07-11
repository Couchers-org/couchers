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
  multiplePages?: boolean;
  shouldSucceed?: boolean;
}

const Template: Story<EventsSectionArgs> = ({
  hasEvents = true,
  multiplePages = true,
  shouldSucceed = true,
} = {}) => {
  setMocks({ hasEvents, multiplePages, shouldSucceed });
  return <EventsSection community={community} />;
};

export const OnePage = Template.bind({});
OnePage.args = {
  multiplePages: false,
};

export const multiplePages = Template.bind({});

export const NoEvents = Template.bind({});
NoEvents.args = {
  hasEvents: false,
};

export const ErrorListingEvents = Template.bind({});
ErrorListingEvents.args = {
  shouldSucceed: false,
};

function setMocks({
  hasEvents,
  multiplePages,
  shouldSucceed,
}: Required<EventsSectionArgs>) {
  mockedService.events.listCommunityEvents = async (_, pageToken) => {
    if (shouldSucceed) {
      if (hasEvents && multiplePages) {
        return {
          eventsList: events,
          nextPageToken: pageToken ? "" : "2",
        };
      }

      return {
        eventsList: hasEvents ? [...events, ...events] : [],
        nextPageToken: "",
      };
    }
    throw new Error("Error listing events");
  };
}
