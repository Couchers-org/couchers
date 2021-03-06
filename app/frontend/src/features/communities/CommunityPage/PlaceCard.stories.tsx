import { Meta, Story } from "@storybook/react";
import PlaceCard from "features/communities/CommunityPage/PlaceCard";
import place from "test/fixtures/place.json";

export default {
  component: PlaceCard,
  title: "Communities/CommunityPage/PlaceCard",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <PlaceCard {...args} />
  </>
);

export const placeCard = Template.bind({});
placeCard.args = {
  place,
};
