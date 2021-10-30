import { Meta, Story } from "@storybook/react";

import RatingsSlider from "./RatingsSlider";

export default {
  component: RatingsSlider,
  title: "Components/Composite/RatingsSlider",
} as Meta;

const Template: Story<any> = (args) => (
  <RatingsSlider {...args} defaultValue={0} />
);

export const ratingsSlider = Template.bind({});
