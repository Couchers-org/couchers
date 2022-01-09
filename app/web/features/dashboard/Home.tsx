import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { DASHBOARD } from "appConstants";
import Button from "components/Button";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import HtmlMeta from "components/HtmlMeta";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import CommunitiesDialog from "features/dashboard/CommunitiesDialog";
import CommunitiesList from "features/dashboard/CommunitiesList";
import {
  ALL_COMMUNITIES_LINK,
  COMMUNITY_BUILDER_FORM_LINK,
  COMMUNITY_BUILDER_FORM_TEXT,
  CONTRIBUTE_PILL,
  CONTRIBUTE_TITLE,
  LANDING_TEXT,
  LAST_UPDATE,
  OUTREACH_MARKDOWN,
  OUTREACH_PILL,
  OUTREACH_SUBTITLE,
  OUTREACH_TITLE,
  UPDATES_MARKDOWN,
  UPDATES_PILL,
  UPDATES_TITLE,
  WELCOME,
  YOUR_COMMUNITIES_HEADING,
  YOUR_COMMUNITIES_HELPER_TEXT,
  YOUR_COMMUNITIES_HELPER_TEXT2,
} from "features/dashboard/constants";
import DashboardBanners from "features/dashboard/DashboardBanners";
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

export default function Home() {
  const classes = useStyles();
  const [isCommunitiesDialogOpen, setIsCommunitiesDialogOpen] = useState(false);

  return (
    <>
      <HtmlMeta title={DASHBOARD} />
      <PageTitle>{WELCOME}</PageTitle>

      <Typography variant="body1" paragraph>
        {LANDING_TEXT}
      </Typography>
      <DashboardBanners />
      <Typography variant="h2">{YOUR_COMMUNITIES_HEADING}</Typography>
      <Typography variant="body1" paragraph>
        {YOUR_COMMUNITIES_HELPER_TEXT}
      </Typography>
      <CommunitiesList />
      <Button
        onClick={() => {
          setIsCommunitiesDialogOpen(true);
        }}
        className={classes.button}
      >
        {ALL_COMMUNITIES_LINK}
      </Button>

      <CommunitiesDialog
        isOpen={isCommunitiesDialogOpen}
        onClose={() => setIsCommunitiesDialogOpen(false)}
      />

      <Typography variant="body1" className={classes.communityText2}>
        {YOUR_COMMUNITIES_HELPER_TEXT2}
      </Typography>
      <Button
        href={COMMUNITY_BUILDER_FORM_LINK}
        target="_blank"
        rel="noreferrer noopener"
      >
        {COMMUNITY_BUILDER_FORM_TEXT}
      </Button>

      <MyEvents />

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="updates-content"
          id="updates-header"
        >
          <Typography variant="h2">
            {UPDATES_TITLE}
            <Chip className={classes.chip} size="small" label={UPDATES_PILL} />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {LAST_UPDATE}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown source={UPDATES_MARKDOWN} topHeaderLevel={3} />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="weekly-events-content"
          id="weekly-events-header"
        >
          <Typography variant="h2">
            {OUTREACH_TITLE}
            <Chip className={classes.chip} size="small" label={OUTREACH_PILL} />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {OUTREACH_SUBTITLE}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown source={OUTREACH_MARKDOWN} topHeaderLevel={3} />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="contribute-content"
          id="contribute-header"
        >
          <Typography variant="h2">
            {CONTRIBUTE_TITLE}
            <Chip
              className={classes.chip}
              size="small"
              label={CONTRIBUTE_PILL}
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
