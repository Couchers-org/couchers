import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import events from "test/fixtures/events.json";

import CreateEventPage from "./CreateEventPage";

export default {
  component: CreateEventPage,
  title: "Communities/Events/CreateEventPage",
  argTypes: {
    shouldSucceed: { control: "boolean" },
  },
} as Meta;

interface CreateEventArgs {
  shouldSucceed: boolean;
}

export const createEventPage: Story<CreateEventArgs> = ({ shouldSucceed }) => {
  setMocks({ shouldSucceed });
  return <CreateEventPage />;
};

function setMocks({ shouldSucceed }: CreateEventArgs) {
  mockedService.api.uploadFile = async (file) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    return {
      key: "photo-key",
      thumbnail_url: base64,
      full_url: base64,
      filename: "",
      file,
    };
  };
  mockedService.events.createEvent = async () => {
    if (shouldSucceed) {
      return events[0];
    }
    throw new Error("Error creating event");
  };
}
