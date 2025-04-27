import { Link as MuiLink, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import StyledLink from "components/StyledLink";
import CommunitiesList from "features/dashboard/CommunitiesList";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";

const COMMUNITY_BUILDER_FORM_LINK =
  "https://couchers.org/community-builder-form";

const useStyles = makeStyles((theme) => ({
  createCommunityText: {
    paddingBlockStart: theme.spacing(2),
  },
  browseCommunitiesLink: {
    verticalAlign: "baseline",
  },
}));

export default function CommunitiesSection() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const classes = useStyles();

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {t("dashboard:your_communities_heading")}
      </Typography>
      <Typography variant="body1" paragraph>
        <Trans i18nKey="dashboard:your_communities_helper_text">
          {`You have been added to all communities based on your location. Feel free to `}
          <StyledLink
            href="/communities"
            className={classes.browseCommunitiesLink}
            underline="hover"
          >
            browse communities
          </StyledLink>
          {` in other locations as well.`}
        </Trans>
      </Typography>
      <CommunitiesList />

      <Typography
        variant="body1"
        paragraph
        className={classes.createCommunityText}
      >
        <Trans i18nKey="dashboard:your_communities_helper_text2">
          {`Don't see your community? `}
          <MuiLink
            href={COMMUNITY_BUILDER_FORM_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Get it started!
          </MuiLink>
        </Trans>
      </Typography>
    </>
  );
}
