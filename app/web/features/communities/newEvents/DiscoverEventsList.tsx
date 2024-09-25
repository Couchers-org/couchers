import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import TextBody from "components/TextBody";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useMemo } from "react";

import { useEventSearch } from "../events/hooks";
import EventsList from "./EventsList";

const DiscoverEventsList = ({
  eventType,
  isVerticalStyle = false,
  isMyCommunities,
  isOnlineOnly,
}: {
  eventType: EventsType;
  isVerticalStyle?: boolean;
  isMyCommunities: boolean;
  isOnlineOnly: boolean;
}) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const { data, error, hasNextPage, fetchNextPage, isLoading } = useEventSearch(
    {
      pastEvents: eventType === "past",
      pageSize: 10,
      isMyCommunities,
      isOnlineOnly,
    }
  );

  const flatEvents = useMemo(
    () => data?.pages.flatMap((page) => page.eventsList) || [],
    [data]
  );
  const hasEvents = flatEvents?.length > 0;

  return (
    <>
      {!hasEvents && !isLoading && (
        <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <EventsList
          events={flatEvents}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isVerticalStyle={isVerticalStyle}
        />
      )}
    </>
  );
};

export default DiscoverEventsList;
