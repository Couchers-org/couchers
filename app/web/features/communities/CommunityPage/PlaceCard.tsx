import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  styled,
  useMediaQuery,
} from "@mui/material";
import Link from "next/link";
import { Page } from "proto/pages_pb";
import React, { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { routeToPlace } from "routes";
import { theme } from "theme";
import stripMarkdown from "utils/stripMarkdown";

const StyledImage = styled("img")(() => ({
  backgroundColor: theme.palette.grey[200],
  height: 80,
  objectFit: "contain",
  [theme.breakpoints.up("sm")]: {
    height: 100,
  },
  [theme.breakpoints.up("md")]: {
    height: 120,
  },
}));

const StyledTitle = styled(LinesEllipsis)(() => ({
  ...theme.typography.h3,
  height: `calc(2 * calc(${theme.typography.h3.lineHeight} * ${theme.typography.h3.fontSize}))`,
  marginBottom: theme.spacing(0.5),
  marginTop: 0,
}));

const StyledPlacePreview = styled(LinesEllipsis)(() => ({
  ...theme.typography.caption,
  marginTop: theme.spacing(0.5),
  [theme.breakpoints.down("md")]: {
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
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const contentPreview = useMemo(
    () => stripMarkdown(place.content.substring(0, 300).replace("\n", " ")),
    [place.content],
  );
  return (
    <Card className={className}>
      <Link href={routeToPlace(place.pageId, place.slug)}>
        <CardActionArea>
          <CardMedia
            src={
              place.photoUrl ? place.photoUrl : "/img/placeImagePlaceholder.svg"
            }
            component={StyledImage}
          />

          <CardContent>
            <StyledTitle text={place.title} maxLine={2} component="h3" />
            <StyledPlacePreview
              text={place.address}
              maxLine={isMdUp ? 4 : 2}
              component="p"
            />
            {contentPreview && (
              <StyledPlacePreview
                text={contentPreview}
                maxLine={isMdUp ? 6 : 2}
                component="p"
              />
            )}
          </CardContent>
        </CardActionArea>
      </Link>
    </Card>
  );
}
