import { Meta, Story } from "@storybook/react";

import { place } from "../../../stories/__mocks__/service";
import PlaceCard from "./PlaceCard";

export default {
  title: "Communities/CommunityPage/PlaceCard",
  component: PlaceCard,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <div style={{ maxWidth: 180 }}>
      <PlaceCard {...args} />
    </div>
  </>
);

export const placeCard = Template.bind({});
placeCard.args = {
  place,
};
