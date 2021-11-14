import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import Link from "next/link";
import { Page } from "proto/pages_pb";
import React, { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { routeToPlace } from "routes";
import makeStyles from "utils/makeStyles";
import stripMarkdown from "utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  image: {
    backgroundColor: theme.palette.grey[200],
    height: 80,
    objectFit: "contain",
    [theme.breakpoints.up("sm")]: {
      height: 100,
    },
    [theme.breakpoints.up("md")]: {
      height: 120,
    },
  },
  place: {
    ...theme.typography.caption,
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      height: `calc(2 * calc(${theme.typography.caption.lineHeight} * ${theme.typography.caption.fontSize}))`,
    },
  },
  preview: {
    ...theme.typography.caption,
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      height: `calc(2 * calc(${theme.typography.caption.lineHeight} * ${theme.typography.caption.fontSize}))`,
    },
  },
  title: {
    ...theme.typography.h3,
    height: `calc(2 * calc(${theme.typography.h3.lineHeight} * ${theme.typography.h3.fontSize}))`,
    marginBottom: theme.spacing(0.5),
    marginTop: 0,
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
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const contentPreview = useMemo(
    () => stripMarkdown(place.content.substr(0, 300).replace("\n", " ")),
    [place.content]
  );
  return (
    <Card className={className}>
      <Link href={routeToPlace(place.pageId, place.slug)}>
        <a>
          <CardActionArea>
            <CardMedia
              src={
                place.photoUrl
                  ? place.photoUrl
                  : "/img/placeImagePlaceholder.svg"
              }
              className={classes.image}
              component="img"
            />
            <CardContent>
              <LinesEllipsis
                text={place.title}
                maxLine={2}
                component="h3"
                className={classes.title}
              />
              <LinesEllipsis
                text={place.address}
                maxLine={isMdUp ? 4 : 2}
                component="p"
                className={classes.place}
              />
              {contentPreview && (
                <LinesEllipsis
                  text={contentPreview}
                  maxLine={isMdUp ? 6 : 2}
                  component="p"
                  className={classes.preview}
                />
              )}
            </CardContent>
          </CardActionArea>
        </a>
      </Link>
    </Card>
  );
}
