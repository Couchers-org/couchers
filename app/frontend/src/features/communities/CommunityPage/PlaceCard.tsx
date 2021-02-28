import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  makeStyles,
} from "@material-ui/core";
import React, { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { Link } from "react-router-dom";

import { Page } from "../../../pb/pages_pb";
import { routeToPlace } from "../../../routes";
import stripMarkdown from "../../../utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  link: { textDecoration: "none" },
  image: {
    height: 80,
    backgroundColor: theme.palette.grey[200],
  },
  title: {
    ...theme.typography.h3,
    marginTop: 0,
    marginBottom: theme.spacing(0.5),
    height: `calc(2 * calc(${theme.typography.h3.lineHeight} * ${theme.typography.h3.fontSize}))`,
  },
  place: {
    ...theme.typography.caption,
    marginTop: theme.spacing(0.5),
    height: `calc(2 * calc(${theme.typography.caption.lineHeight} * ${theme.typography.caption.fontSize}))`,
  },
  preview: {
    ...theme.typography.caption,
    marginTop: theme.spacing(0.5),
    height: `calc(2 * calc(${theme.typography.caption.lineHeight} * ${theme.typography.caption.fontSize}))`,
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
    <Card className={className}>
      <Link
        to={routeToPlace(place.pageId, place.slug)}
        className={classes.link}
        component={CardActionArea}
      >
        <CardMedia src={place.photoUrl} className={classes.image} />
        <CardContent>
          <LinesEllipsis
            text={place.title}
            maxLine={2}
            component="h3"
            className={classes.title}
          />
          <LinesEllipsis
            text={place.address}
            maxLine={2}
            component="p"
            className={classes.place}
          />
          {contentPreview && (
            <LinesEllipsis
              text={contentPreview}
              maxLine={2}
              component="p"
              className={classes.preview}
            />
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
