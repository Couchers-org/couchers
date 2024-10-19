import { Meta, Story } from "@storybook/react";

import EventsPage from "./EventsPage";

export default {
  component: EventsPage,
  title: "Communities/Events/EventsPage",
} as Meta;

const Template: Story<typeof EventsPage> = () => <EventsPage />;

export const Default = Template.bind({});
Default.args = {};
