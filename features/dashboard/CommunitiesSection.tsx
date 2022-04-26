import { Link as MuiLink, makeStyles, Typography } from "@material-ui/core";
import CommunitiesDialog from "features/dashboard/CommunitiesDialog";
import CommunitiesList from "features/dashboard/CommunitiesList";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { useState } from "react";

const COMMUNITY_BUILDER_FORM_LINK =
  "https://couchers.org/community-builder-form";

const useStyles = makeStyles((theme) => ({
  communityText2: {
    paddingBlockStart: theme.spacing(2),
    paddingBlockEnd: theme.spacing(1),
  },
}));

export default function CommunitiesSection() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const classes = useStyles();
  const [isCommunitiesDialogOpen, setIsCommunitiesDialogOpen] =
    useState<boolean>(false);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {t("dashboard:your_communities_heading")}
      </Typography>
      <Typography variant="body1" paragraph>
        <Trans i18nKey="dashboard:your_communities_helper_text">
          {`You have been added to all communities based on your location. Feel free to `}
          <MuiLink
            component="button"
            style={{ verticalAlign: "baseline" }}
            onClick={() => {
              setIsCommunitiesDialogOpen(true);
            }}
          >
            {/* @todo: revisit this UI. A button that opens a popup shouldn't look like a link */}
            browse communities
          </MuiLink>
          {` in other locations as well.`}
        </Trans>
      </Typography>

      <CommunitiesList />

      <CommunitiesDialog
        isOpen={isCommunitiesDialogOpen}
        onClose={() => setIsCommunitiesDialogOpen(false)}
      />

      <Typography
        variant="body1"
        gutterBottom
        className={classes.communityText2}
      >
        <Trans i18nKey="dashboard:your_communities_helper_text2">
          {`Don't see your community? `}
          <MuiLink
            href={COMMUNITY_BUILDER_FORM_LINK}
            target="_blank"
            rel="noreferrer noopener"
          >
            Get it started!
          </MuiLink>
        </Trans>
      </Typography>
    </>
  );
}
