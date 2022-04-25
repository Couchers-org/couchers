import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Typography,
} from "@material-ui/core";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import { ExpandMoreIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";

import useAccordionStyles from "./accordionStyles";

const AccordionOutreach: React.FC = () => {
  const classes = useAccordionStyles();
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  return (
    <Accordion className={classes.accordion}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="contribute-content"
        id="contribute-header"
      >
        <Typography variant="h2">
          {t("global:contribute_title")}
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
  );
};

export default AccordionOutreach;
