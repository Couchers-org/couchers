import { makeStyles, Typography } from "@material-ui/core";
import classNames from "classnames";
import React, { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { Link } from "react-router-dom";

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
} from "../../../components/Card";
import { Page } from "../../../pb/pages_pb";
import { routeToPlace } from "../../../routes";
import stripMarkdown from "../../../utils/stripMarkdown";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 160,
    "& p": {
      marginTop: theme.spacing(0.5),
    },
  },
  link: { textDecoration: "none" },
  image: {
    height: 80,
    backgroundColor: theme.palette.grey[200],
  },
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
    <Link to={routeToPlace(place.pageId, place.slug)} className={classes.link}>
      <Card className={classNames(classes.root, className)}>
        <CardActionArea>
          <CardMedia image={place.photoUrl} className={classes.image} />
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
    </Link>
  );
}
