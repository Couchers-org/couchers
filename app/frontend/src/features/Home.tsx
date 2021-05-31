import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Divider from "components/Divider";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import {
  CONTRIBUTE_MARKDOWN,
  LANDING_TEXT,
  LAST_UPDATE,
  UPDATES_MARKDOWN,
  UPDATES_TITLE,
  WEEKLY_EVENTS_MARKDOWN,
  WEEKLY_EVENTS_SUBTITLE,
  WEEKLY_EVENTS_TITLE,
  WELCOME,
} from "features/constants";
import DashboardBanners from "features/dashboard/DashboardBanners";
import React from "react";

import ContributorForm, { CONTRIBUTE, JOIN_THE_TEAM } from "./contributorForm";

const useStyles = makeStyles((theme) => ({
  accordion: {
    marginBlockStart: theme.spacing(2),
    "& .MuiAccordionSummary-content": {
      alignItems: "baseline",
      flexWrap: "wrap",
    },
  },
  accordionTitle: {
    flexBasis: "30vw",
    flexGrow: 0.001,
    marginInlineEnd: theme.spacing(4),
  },
  accordionSubtitle: {
    ...theme.typography.h3,
    color: theme.palette.grey[600],
    flexGrow: 100,
  },
}));

export default function Home() {
  const classes = useStyles();
  return (
    <>
      <PageTitle>{WELCOME}</PageTitle>
      <DashboardBanners />
      <Markdown source={LANDING_TEXT} />

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="weekly-events-content"
          id="weekly-events-header"
        >
          <Typography variant="h2" className={classes.accordionTitle}>
            {WEEKLY_EVENTS_TITLE}
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {WEEKLY_EVENTS_SUBTITLE}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown source={WEEKLY_EVENTS_MARKDOWN} topHeaderLevel={3} />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="updates-content"
          id="updates-header"
        >
          <Typography variant="h2" className={classes.accordionTitle}>
            {UPDATES_TITLE}
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
          aria-controls="contribute-content"
          id="contribute-header"
        >
          <Typography variant="h2" className={classes.accordionTitle}>
            {CONTRIBUTE}
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {JOIN_THE_TEAM}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown source={CONTRIBUTE_MARKDOWN} topHeaderLevel={3} />
          <ContributorForm />
        </AccordionDetails>
      </Accordion>
    </>
  );
}
