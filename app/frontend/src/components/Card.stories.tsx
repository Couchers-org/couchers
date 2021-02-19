import { Typography } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import React from "react";

import Button from "./Button";
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
} from "./Card";

export default {
  title: "Components/Simple/Card",
  component: Card,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <Card {...args} style={{ maxWidth: 300 }}>
      <CardActionArea>
        <CardMedia
          image="https://loremflickr.com/320/120"
          style={{ height: 120 }}
          title="Placeholder"
        />
        <CardContent>
          <Typography variant="h3">Body title</Typography>
          <Typography variant="body2">This is the text of the card.</Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button variant="text">Share</Button>
        <Button variant="text">Learn More</Button>
      </CardActions>
    </Card>
  </>
);

export const card = Template.bind({});
