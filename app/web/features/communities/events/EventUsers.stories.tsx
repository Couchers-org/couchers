import { Meta, Story } from "@storybook/react";

import EventUsers, { EventUsersProps } from "./EventUsers";

export default {
  component: EventUsers,
  title: "Communities/Events/EventUsers",
} as Meta;

const Template: Story<EventUsersProps> = (args) => <EventUsers {...args} />;

export const WithUsers = Template.bind({});
WithUsers.args = {
  userIds: [1, 3, 4],
  title: "Organizers",
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  error: {
    code: 2,
    message: "Error getting event users.",
    metadata: {},
    name: "Error",
  },
  userIds: [],
  title: "Organizers",
};

export const MultiplePagesOfUsers = Template.bind({});
MultiplePagesOfUsers.args = {
  hasNextPage: true,
  userIds: [1, 3, 4],
  title: "Organizers",
};
MultiplePagesOfUsers.argTypes = {
  onSeeAllClick: {
    action: "onSeeAllClick",
  },
};
