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
import { UPDATES_MARKDOWN } from "./constants";

const AccordionFeatureUpdates: React.FC = () => {
  const classes = useAccordionStyles();
  const { t } = useTranslation([DASHBOARD]);
  return (
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
        <Markdown source={UPDATES_MARKDOWN} topHeaderLevel={3} />
      </AccordionDetails>
    </Accordion>
  );
};

export default AccordionFeatureUpdates;
