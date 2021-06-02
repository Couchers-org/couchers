import { Meta, Story } from "@storybook/react";
import ReferenceStepHeader, {
  ReferenceStepHeaderProps,
} from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import { ReferenceType } from "pb/references_pb";
import { referenceTypeRoute } from "routes";
import users from "test/fixtures/users.json";

export default {
  component: ReferenceStepHeader,
  title: "Profile/References/ReferenceStepHeader",
} as Meta;

const Template: Story<ReferenceStepHeaderProps> = (args) => (
  <ReferenceStepHeader {...args} />
);

export const friendOverview = Template.bind({});
friendOverview.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND],
};
export const surfedOverview = Template.bind({});
surfedOverview.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED],
};
export const hostedOverview = Template.bind({});
hostedOverview.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED],
};
