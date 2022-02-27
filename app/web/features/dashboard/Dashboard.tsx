import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { DASHBOARD as DASHBOARD_TITLE } from "appConstants";
import Button from "components/Button";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import HtmlMeta from "components/HtmlMeta";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import CommunitiesDialog from "features/dashboard/CommunitiesDialog";
import CommunitiesList from "features/dashboard/CommunitiesList";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";

import MyEvents from "./MyEvents";

const useStyles = makeStyles((theme) => ({
  button: { display: "block", marginTop: theme.spacing(1) },
  divider: { marginTop: theme.spacing(3) },
  accordion: {
    marginBlockStart: theme.spacing(2),
    "& .MuiAccordionSummary-content": {
      display: "grid",
      alignItems: "baseline",
      gridTemplateColumns: "repeat(auto-fit, 100%)",
      columnGap: theme.spacing(2),
      [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "1fr 2fr",
      },
    },
    "& .MuiAccordionDetails-root": {
      display: "block",
    },
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
  accordionSubtitle: {
    ...theme.typography.h3,
    color: theme.palette.grey[600],
  },
  communityText2: {
    marginBlockStart: theme.spacing(2),
    marginBlockEnd: theme.spacing(1),
  },
}));

export default function Dashboard() {
  const { t } = useTranslation([DASHBOARD]);
  const classes = useStyles();
  const [isCommunitiesDialogOpen, setIsCommunitiesDialogOpen] = useState(false);

  return (
    <>
      <HtmlMeta title={DASHBOARD_TITLE} />
      <PageTitle>{t("dashboard:welcome")}</PageTitle>

      <Typography variant="body1" paragraph>
        {t("dashboard:landing_text")}
      </Typography>
      <DashboardBanners />
      <Typography variant="h2">
        {t("dashboard:your_communities_heading")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("dashboard:your_communities_helper_text")}
      </Typography>
      <CommunitiesList />
      <Button
        onClick={() => {
          setIsCommunitiesDialogOpen(true);
        }}
        className={classes.button}
      >
        {t("dashboard:all_communities_link")}
      </Button>

      <CommunitiesDialog
        isOpen={isCommunitiesDialogOpen}
        onClose={() => setIsCommunitiesDialogOpen(false)}
      />

      <Typography variant="body1" className={classes.communityText2}>
        {t("dashboard:your_communities_helper_text2")}
      </Typography>
      <Button
        href={t("dashboard:community_builder_form_link")}
        target="_blank"
        rel="noreferrer noopener"
      >
        {t("dashboard:community_builder_form_text")}
      </Button>

      <MyEvents />

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="updates-content"
          id="updates-header"
        >
          <Typography variant="h2">
            {t("dashboard:updates_title")}
            <Chip
              className={classes.chip}
              size="small"
              label={t("dashboard:updates_pill")}
            />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {t("dashboard:last_update")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown
            source={t("dashboard:updates_markdown")}
            topHeaderLevel={3}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="weekly-events-content"
          id="weekly-events-header"
        >
          <Typography variant="h2">
            {t("dashboard:outreach_title")}
            <Chip
              className={classes.chip}
              size="small"
              label={t("dashboard:outreach_pill")}
            />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {t("dashboard:outreach_subtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown
            source={t("dashboard:outreach_markdown")}
            topHeaderLevel={3}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="contribute-content"
          id="contribute-header"
        >
          <Typography variant="h2">
            {t("dashboard:contribute_title")}
            <Chip
              className={classes.chip}
              size="small"
              label={t("dashboard:contribute_pill")}
            />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {JOIN_THE_TEAM}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <StandaloneContributorForm />
        </AccordionDetails>
      </Accordion>
    </>
  );
}
