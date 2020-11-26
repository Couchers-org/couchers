import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Navigation from ".";

export default {
	title: "Components/Navigation",
	component: Navigation,
} as Meta;

export const Primary: React.SFC<{}> = () => <Navigation />;
