import { Meta, Story } from "@storybook/react";
import ReferenceStepHeader, {
  ReferenceStepHeaderProps,
} from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import { ReferenceType } from "proto/references_pb";
import { referenceTypeRoute } from "routes";
import users from "test/fixtures/users.json";

export default {
  component: ReferenceStepHeader,
  title: "Profile/References/ReferenceStepHeader",
} as Meta;

const Template: Story<ReferenceStepHeaderProps> = (args) => (
  <ReferenceStepHeader {...args} />
);

export const friendReference = Template.bind({});
friendReference.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND],
  isSubmitStep: false,
};
export const surfedReference = Template.bind({});
surfedReference.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED],
  isSubmitStep: false,
};
export const hostedReference = Template.bind({});
hostedReference.args = {
  name: users[0].name,
  referenceType: referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED],
  isSubmitStep: false,
};

export const submitReference = Template.bind({});
submitReference.args = {
  isSubmitStep: true,
};
