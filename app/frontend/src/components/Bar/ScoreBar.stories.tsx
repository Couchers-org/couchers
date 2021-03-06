import { Meta, Story } from "@storybook/react";

import { COMMUNITY_STANDING } from "../../features/constants";
import ScoreBar from "./ScoreBar";

export default {
  component: ScoreBar,
  title: "Components/Composite/ScoreBar",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <ScoreBar {...args}>{COMMUNITY_STANDING}</ScoreBar>
  </>
);

export const scoreBar = Template.bind({});
scoreBar.args = {
  value: 50,
};
