import { Button, styled, Typography } from "@mui/material";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { newEventRoute } from "routes";
import { theme } from "theme";

import DiscoverEventsList from "../events/DiscoverEventsList";
import MyEventsList from "./MyEventsList";

const StyledHeaderRow = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  paddingBottom: theme.spacing(1),
}));

const StyledButton = styled(Button)(() => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  margin: theme.spacing(2),
  padding: theme.spacing(1, 2),
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  fontWeight: "bold",
}));

const StyledColumn = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
}));

const EventsPage = () => {
  const router = useRouter();

  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  return (
    <div>
      <StyledHeaderRow>
        <PageTitle>{t("communities:events_title")}</PageTitle>
        <StyledButton size="small" onClick={() => router.push(newEventRoute)}>
          {t("communities:create_new_event")}
        </StyledButton>
      </StyledHeaderRow>
      <StyledColumn id="my-events">
        <Typography variant="h2">{t("communities:your_events")}</Typography>
        <MyEventsList />
      </StyledColumn>
      <div id="discover">
        <DiscoverEventsList />
      </div>
    </div>
  );
};

export default EventsPage;
