import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  makeStyles,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import React, { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";

import { Page } from "../../../pb/pages_pb";
import stripMarkdown from "../../../utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 160,
    "& p": {
      marginTop: theme.spacing(0.5),
    },
  },
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
  const contentPreview = useMemo(
    () => stripMarkdown(place.content.substr(0, 300).replace("\n", " ")),
    [place.content]
  );
  return (
    <Card className={classNames(classes.root, className)}>
      <CardActionArea>
        <CardMedia
          image="https://loremflickr.com/320/240"
          className={classes.image}
        />
        <CardContent>
          <Typography variant="h3" className={classes.title}>
            <LinesEllipsis text={place.title} maxLine={2} />
          </Typography>
          <Typography variant="caption" component="p">
            <LinesEllipsis text={place.address} maxLine={2} />
          </Typography>
          {contentPreview && (
            <Typography variant="caption" component="p">
              <LinesEllipsis text={contentPreview} maxLine={2} />
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
