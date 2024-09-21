import { Typography } from "@material-ui/core";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";

interface EventListProps {
  eventType: EventsType;
}

const EventsList = ({ eventType }: EventListProps) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  return (
    <div>
      <Typography variant="h3">
        {eventType === "upcoming"
          ? t("communities:your_upcoming_events")
          : t("communities:your_past_events")}
      </Typography>
    </div>
  );
};

export default EventsList;
