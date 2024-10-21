import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";

import CommunityEventsList from "./CommunityEventsList";

export default {
  component: CommunityEventsList,
  title: "Communities/Events/CommunityEventsList",
} as Meta;

interface CommunityEventsListArgs {
  pagesOfEvent?: "none" | "one-page" | "multiple-pages";
  shouldListAttendeesSucceed?: boolean;
  shouldListEventsSucceed?: boolean;
}

const Template: Story<CommunityEventsListArgs> = ({
  pagesOfEvent = "one-page",
  shouldListAttendeesSucceed = true,
  shouldListEventsSucceed = true,
} = {}) => {
  setMocks({
    pagesOfEvent,
    shouldListAttendeesSucceed,
    shouldListEventsSucceed,
  });
  return <CommunityEventsList community={community} />;
};

export const OnePageOfEvents = Template.bind({});

export const MultiplePagesOfEvents = Template.bind({});
MultiplePagesOfEvents.args = {
  pagesOfEvent: "multiple-pages",
};

export const NoEvents = Template.bind({});
NoEvents.args = {
  pagesOfEvent: "none",
};

export const ErrorLoadingEvents = Template.bind({});
ErrorLoadingEvents.args = {
  shouldListEventsSucceed: false,
};

function setMocks({
  pagesOfEvent,
  shouldListEventsSucceed,
}: Required<CommunityEventsListArgs>) {
  mockedService.events.listCommunityEvents = async () => {
    return shouldListEventsSucceed
      ? {
          eventsList: pagesOfEvent === "none" ? [] : events,
          nextPageToken: pagesOfEvent === "multiple-pages" ? "3" : "",
        }
      : Promise.reject(new Error("Error listing community events"));
  };
  mockedService.events.listEventAttendees = async ({ eventId }) => {
    return {
      nextPageToken: "",
      attendeeUserIdsList: eventId < 3 ? [1, 2, 3, 4, 5] : [1, 2, 3],
    };
  };
}
