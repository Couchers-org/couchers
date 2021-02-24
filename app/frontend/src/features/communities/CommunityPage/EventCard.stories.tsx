import { Meta, Story } from "@storybook/react";

//import { event } from "../../../test/fixtures/event.json";
import EventCard from "./EventCard";

export default {
  title: "Communities/CommunityPage/EventCard",
  component: EventCard,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <div>
      <EventCard {...args} />
    </div>
  </>
);

export const eventCard = Template.bind({});
eventCard.args = {
  event: {
    title: "Weekly Meetup",
    creatorName: "John Doherty",
    location: "Concertgebouw",
    startTime: { seconds: Date.now() / 1000, nanos: 0 },
  },
};
