import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  DialogContent,
  Link,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import { Dialog, DialogActions, DialogTitle } from "components/Dialog";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { CLOSE } from "features/constants";
import {
  ALL_COMMUNITIES_HEADING,
  ALL_COMMUNITIES_LINK,
  COMMUNITY_BUILDER_FORM_LINK,
  COMMUNITY_BUILDER_FORM_TEXT,
  CONTRIBUTE_PILL,
  CONTRIBUTE_TITLE,
  LANDING_TEXT,
  LAST_UPDATE,
  NEW_PILL,
  OUTREACH_MARKDOWN,
  OUTREACH_PILL,
  OUTREACH_SUBTITLE,
  OUTREACH_TITLE,
  TOWN_HALL_MARKDOWN,
  TOWN_HALL_PILL,
  TOWN_HALL_SUBTITLE,
  TOWN_HALL_TITLE,
  UPDATES_MARKDOWN,
  UPDATES_PILL,
  UPDATES_TITLE,
  WEEKLY_EVENTS_MARKDOWN,
  WEEKLY_EVENTS_PILL,
  WEEKLY_EVENTS_SUBTITLE,
  WEEKLY_EVENTS_TITLE,
  WELCOME,
  YOUR_COMMUNITIES_HEADING,
  YOUR_COMMUNITIES_HELPER_TEXT,
  YOUR_COMMUNITIES_HELPER_TEXT2,
} from "features/dashboard/constants";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { useState } from "react";

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
  chip: {
    marginLeft: theme.spacing(1),
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
      <Typography variant="body1" paragraph>
        {YOUR_COMMUNITIES_HELPER_TEXT}
      </Typography>
      <Typography variant="body1" paragraph>
        <Link href={COMMUNITY_BUILDER_FORM_LINK}>
          {COMMUNITY_BUILDER_FORM_TEXT}
        </Link>
      </Typography>
      <Typography variant="body1" paragraph>
        {YOUR_COMMUNITIES_HELPER_TEXT2}
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
      <Dialog
        aria-labelledby="communities-dialog-title"
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
          aria-controls="town-hall-content"
          id="town-hall-header"
        >
          <Typography variant="h2">
            {TOWN_HALL_TITLE}
            <Chip
              className={classes.chip}
              size="small"
              label={TOWN_HALL_PILL}
            />
          </Typography>
          <Typography className={classes.accordionSubtitle}>
            {TOWN_HALL_SUBTITLE}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Markdown source={TOWN_HALL_MARKDOWN} topHeaderLevel={3} />
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="weekly-events-content"
          id="weekly-events-header"
        >
          <Typography variant="h2">
            {WEEKLY_EVENTS_TITLE}
            <Chip
              className={classes.chip}
              size="small"
              label={WEEKLY_EVENTS_PILL}
            />
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
            <Chip
              className={classes.chip}
              size="small"
              label={NEW_PILL}
              color="primary"
            />
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
