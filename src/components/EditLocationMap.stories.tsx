import { Meta, Story } from "@storybook/react";
import * as React from "react";

import EditLocationMap, {
  ApproximateLocation,
  EditLocationMapProps,
} from "./EditLocationMap";

export default {
  argTypes: {
    backgroundColor: { control: "color" },
  },
  component: EditLocationMap,
  title: "Components/Composite/EditLocationMap",
} as Meta;

const london = {
  address: "London",
  lat: 51.5,
  lng: -0.1,
  radius: 250,
} as EditLocationMapProps["initialLocation"];

const new_york = {
  address: "New York",
  lat: 40.71387,
  lng: -74.00566,
  radius: 1000,
} as EditLocationMapProps["initialLocation"];

const Template: Story<EditLocationMapProps> = (args) => {
  const [loc, setLoc] = React.useState<ApproximateLocation | null>(null);
  const [hist, setHist] = React.useState<(ApproximateLocation | null)[]>([]);

  const updateLoc = (l: ApproximateLocation | null) => {
    setLoc(l);
    setHist((hist) => hist.concat(l));
  };

  return (
    <div style={{ width: "500" }}>
      <p>Current loc: {JSON.stringify(loc)}</p>
      <EditLocationMap {...args} grow updateLocation={updateLoc} />
      <p>History:</p>
      <ul>
        {hist.map((l, i) => (
          <li key={i}>
            {i}: {JSON.stringify(l)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  initialLocation: london,
  showRadiusSlider: true,
};

export const NewYork = Template.bind({});
NewYork.args = {
  initialLocation: new_york,
  showRadiusSlider: true,
};

export const HiddenRadiusSlider = Template.bind({});
HiddenRadiusSlider.args = {
  initialLocation: new_york,
};

export const NoLocation = Template.bind({});
NoLocation.args = {};

export const Exact = Template.bind({});
Exact.args = {
  exact: true,
};

export const ExactNewYork = Template.bind({});
ExactNewYork.args = {
  initialLocation: new_york,
  exact: true,
};
