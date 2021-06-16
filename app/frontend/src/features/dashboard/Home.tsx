import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  DialogContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import { Dialog, DialogActions, DialogTitle } from "components/Dialog";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { CLOSE } from "features/constants";
import {
  ALL_COMMUNITIES_HEADING,
  ALL_COMMUNITIES_LINK,
  LANDING_TEXT,
  LAST_UPDATE,
  UPDATES_MARKDOWN,
  UPDATES_TITLE,
  WEEKLY_EVENTS_MARKDOWN,
  WEEKLY_EVENTS_SUBTITLE,
  WEEKLY_EVENTS_TITLE,
  WELCOME,
  YOUR_COMMUNITIES_HEADING,
} from "features/dashboard/constants";
import DashboardBanners from "features/dashboard/DashboardBanners";
import React, { useState } from "react";

import ContributorForm, { CONTRIBUTE, JOIN_THE_TEAM } from "../contributorForm";
import CommunitiesList from "./CommunitiesList";

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
  accordionSubtitle: {
    ...theme.typography.h3,
    color: theme.palette.grey[600],
  },
}));

export default function Home() {
  const classes = useStyles();
  const [isCommunitiesDialogOpen, setIsCommunitiesDialogOpen] = useState(false);

  return (
    <>
      <PageTitle>{WELCOME}</PageTitle>
      <DashboardBanners />
      <Typography variant="h2">{YOUR_COMMUNITIES_HEADING}</Typography>
      <CommunitiesList />
      <Button
        onClick={() => setIsCommunitiesDialogOpen(true)}
        className={classes.button}
      >
        {ALL_COMMUNITIES_LINK}
      </Button>
      <Dialog
        aria-labelledby="communitiies-dialog-title"
        open={isCommunitiesDialogOpen}
        onClose={() => setIsCommunitiesDialogOpen(false)}
      >
        <DialogTitle id="communities-dialog-title">
          {ALL_COMMUNITIES_HEADING}
        </DialogTitle>
        <DialogContent>
          <CommunitiesList all />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCommunitiesDialogOpen(false)}>
            {CLOSE}
          </Button>
        </DialogActions>
      </Dialog>

      <Markdown source={LANDING_TEXT} />

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="weekly-events-content"
          id="weekly-events-header"
        >
          <Typography variant="h2">{WEEKLY_EVENTS_TITLE}</Typography>
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
          <Typography variant="h2">{UPDATES_TITLE}</Typography>
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
          <Typography variant="h2">{CONTRIBUTE}</Typography>
          <Typography className={classes.accordionSubtitle}>
            {JOIN_THE_TEAM}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ContributorForm />
        </AccordionDetails>
      </Accordion>
    </>
  );
}
