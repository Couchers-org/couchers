import { Meta, Story } from "@storybook/react";
import { useState } from "react";

import { message1 } from "../../../stories/__mocks__/service";
import InfiniteMessageLoader from "./InfiniteMessageLoader";
import MessageList from "./MessageList";

const maxId = 999999;

export default {
  title: "Messages/InfiniteMessageLoader",
  component: InfiniteMessageLoader,
  argTypes: {
    markLastSeen: { action: "markLastSeen" },
  },
} as Meta;

const Template: Story<any> = (args) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      ...message1,
      text: { text: `Message id ${maxId}` },
      messageId: maxId,
    },
    {
      ...message1,
      text: { text: `Message id ${maxId - 1}` },
      messageId: maxId - 1,
    },
  ]);
  const addMessages = async () => {
    setLoading(true);
    setTimeout(() => {
      const newMessages = [0, 1, 2, 3].map((index) => ({
        ...message1,
        text: { text: `Message id ${maxId - messages.length - index}` },
        messageId: maxId - messages.length - index,
      }));
      setMessages([...messages, ...newMessages]);
      setLoading(false);
    }, 1000);
  };
  return (
    <>
      <InfiniteMessageLoader
        earliestMessageId={messages[messages.length - 1].messageId}
        fetchNextPage={addMessages}
        isFetchingNextPage={loading}
        {...args}
      >
        <MessageList messages={messages} markLastSeen={args.markLastSeen} />
      </InfiniteMessageLoader>
    </>
  );
};

export const infiniteMessageLoader = Template.bind({});
infiniteMessageLoader.args = {
  hasNextPage: true,
  isError: false,
};
