import { Link as MuiLink, ThemeProvider, Typography } from "@material-ui/core";
import classNames from "classnames";
import StyledLink from "components/StyledLink";
import { useState } from "react";
import { routeToProfile } from "routes";
import makeStyles from "utils/makeStyles";

import CommunitiesDialog from "../CommunitiesDialog";
import useImageOverlayTheme from "./useImageOverlayTheme";

const useStyles = makeStyles((theme) => ({
  coverLinksContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(4),
    justifyContent: "center",
    margin: theme.spacing(4, 2),
  },
  tabAppearance: {
    position: "relative",
    paddingBottom: theme.spacing(1),
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: 40,
      height: 2,
      background: theme.palette.common.white,
      opacity: 0,
    },
    "&:hover::after": {
      opacity: 1,
    },
  },
  selectedTabAppearance: {
    "&::after": {
      opacity: 1,
    },
  },
}));

export default function CoverLinks() {
  const classes = useStyles();

  // because this component is over an image background, we need to use a theme that overrides some styles
  const imageOverlayTheme = useImageOverlayTheme();

  const [communitiesDialogOpen, setCommunitiesDialogOpen] = useState(false);

  return (
    <>
      <div className={classes.coverLinksContainer}>
        <ThemeProvider theme={imageOverlayTheme}>
          <Typography
            color="textPrimary"
            className={classNames(
              classes.tabAppearance,
              classes.selectedTabAppearance
            )}
          >
            Find a host
          </Typography>

          <StyledLink
            underline="none"
            href={routeToProfile()}
            className={classes.tabAppearance}
          >
            Become a host
          </StyledLink>

          <MuiLink
            underline="none"
            component="button"
            className={classes.tabAppearance}
            onClick={() => setCommunitiesDialogOpen(true)}
          >
            Browse communities
          </MuiLink>
        </ThemeProvider>
      </div>

      <CommunitiesDialog
        isOpen={communitiesDialogOpen}
        onClose={() => setCommunitiesDialogOpen(false)}
      />
    </>
  );
}
