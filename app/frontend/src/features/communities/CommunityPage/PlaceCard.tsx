import { makeStyles, Typography } from "@material-ui/core";
import React from "react";

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
} from "../../../components/Card";
import { Page } from "../../../pb/pages_pb";

const useStyles = makeStyles((theme) => ({
  image: { height: 80 },
  title: {
    marginTop: 0,
    marginBottom: theme.spacing(0.5),
  },
}));

export default function PlaceCard({
  place,
  className,
}: {
  place: Page.AsObject;
  className?: string;
}) {
  const classes = useStyles();
  const contentPreview = place.content
    .split("\n")
    .find((line) => line.charAt(0) !== "#");
  return (
    <Card className={className}>
      <CardActionArea>
        <CardMedia
          image="https://loremflickr.com/320/240"
          className={classes.image}
        />
        <CardContent>
          <Typography variant="h3" className={classes.title}>
            {place.title}
          </Typography>
          <Typography variant="caption" component="p" noWrap>
            {place.address}
          </Typography>
          {contentPreview && (
            <Typography variant="caption" component="p" noWrap>
              {contentPreview}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
