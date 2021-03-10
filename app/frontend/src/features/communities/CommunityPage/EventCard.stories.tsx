import { Meta, Story } from "@storybook/react";

//import { event } from "../../../test/fixtures/event.json";
import EventCard from "./EventCard";

export default {
  component: EventCard,
  title: "Communities/CommunityPage/EventCard",
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
    creatorName: "John Doherty",
    location: "Concertgebouw",
    startTime: { nanos: 0, seconds: Date.now() / 1000 },
    title: "Weekly Meetup",
  },
};
