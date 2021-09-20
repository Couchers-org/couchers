import { Meta, Story } from "@storybook/react";
import users from "test/fixtures/users.json";

import EventUsers, { EventUsersProps } from "./EventUsers";

export default {
  component: EventUsers,
  title: "Communities/Events/EventUsers",
} as Meta;

const Template: Story<EventUsersProps> = (args) => <EventUsers {...args} />;
const usersMap = new Map(users.map((user) => [user.userId, user]));

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
  title: "Organizers",
};

export const WithUsers = Template.bind({});
WithUsers.args = {
  users: usersMap,
  userIds: [1, 3, 4],
  title: "Organizers",
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  error: {
    code: 2,
    message: "Error getting event users.",
  },
  userIds: [],
  title: "Organizers",
};

export const MultiplePagesOfUsers = Template.bind({});
MultiplePagesOfUsers.args = {
  hasNextPage: true,
  users: usersMap,
  userIds: [1, 3, 4],
  title: "Organizers",
};
MultiplePagesOfUsers.argTypes = {
  onSeeAllClick: {
    action: "onSeeAllClick",
  },
};
