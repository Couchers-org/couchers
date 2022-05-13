import { Link as MuiLink, ThemeProvider, Typography } from "@material-ui/core";
import classNames from "classnames";
import StyledLink from "components/StyledLink";
import { useState } from "react";
import { routeToProfile } from "routes";
import makeStyles from "utils/makeStyles";

import CommunitiesDialog from "../CommunitiesDialog";
import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: theme.spacing(2),
    columnGap: theme.spacing(4),
    justifyContent: "center",
    margin: theme.spacing(4, 0),
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

export default function HeroLinks() {
  const classes = useStyles();

  // because this component is over an image background, we need to use a theme that overrides some styles
  const imageOverlayTheme = useHeroBackgroundTheme();

  const [communitiesDialogOpen, setCommunitiesDialogOpen] = useState(false);

  return (
    <>
      <div className={classes.linksContainer}>
        <ThemeProvider theme={imageOverlayTheme}>
          <Typography
            color="textPrimary"
            variant="body1"
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
