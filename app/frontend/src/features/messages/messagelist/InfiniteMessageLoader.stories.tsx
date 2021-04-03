import { Meta, Story } from "@storybook/react";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import { useState } from "react";
import mockMessages from "test/fixtures/messages.json";

const maxId = 999999;

export default {
  argTypes: {
    markLastSeen: { action: "markLastSeen" },
  },
  component: InfiniteMessageLoader,
  title: "Messages/InfiniteMessageLoader",
} as Meta;

const Template: Story<any> = (args) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      ...mockMessages[0],
      messageId: maxId,
      text: { text: `Message id ${maxId}` },
    },
    {
      ...mockMessages[0],
      messageId: maxId - 1,
      text: { text: `Message id ${maxId - 1}` },
    },
  ]);
  const addMessages = async () => {
    setLoading(true);
    setTimeout(() => {
      const newMessages = [0, 1, 2, 3].map((index) => ({
        ...mockMessages[0],
        messageId: maxId - messages.length - index,
        text: { text: `Message id ${maxId - messages.length - index}` },
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
