import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Typography,
} from "@material-ui/core";
import { ExpandMoreIcon } from "components/Icons";
import Markdown from "components/Markdown";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";

import useAccordionStyles from "./accordionStyles";

const AccordionOutreach: React.FC = () => {
  const classes = useAccordionStyles();
  const { t } = useTranslation([DASHBOARD]);
  return (
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
  );
};

export default AccordionOutreach;
