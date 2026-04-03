import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  styled,
} from "@mui/material";
import {
  CalendarIcon,
  ChatBubbleIcon,
  HomeIcon,
  PersonIcon,
  SearchIcon,
} from "components/Icons";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useMemo } from "react";
import {
  communitiesRoute,
  dashboardRoute,
  eventsRoute,
  messagesRoute,
  searchRoute,
} from "routes";

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
  boxShadow: "0 -1px 3px rgba(0,0,0,0.1)",
}));

const StyledBottomNavigation = styled(MuiBottomNavigation)(({ theme }) => ({
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  "& .MuiBottomNavigationAction-root": {
    minWidth: "auto",
    padding: theme.spacing(1, 0),
  },
  "& .MuiBottomNavigationAction-label": {
    fontSize: "10px",
    paddingTop: theme.spacing(0.25),
    "&.Mui-selected": {
      fontSize: "10px",
    },
  },
}));

export default function BottomNavigation() {
  const router = useRouter();
  const { t } = useTranslation(GLOBAL);

  // Strip locale prefix from pathname to determine current route
  const currentRoute = useMemo(() => {
    // Remove locale prefix (e.g., /en/, /es/, etc.) from pathname
    const pathWithoutLocale = router.pathname.replace(
      /^\/[a-z]{2}(-[A-Z][a-z]+)?\//,
      "/",
    );

    if (pathWithoutLocale.startsWith("/messages")) return messagesRoute;
    if (pathWithoutLocale.startsWith("/communities")) return communitiesRoute;
    if (pathWithoutLocale.startsWith("/search")) return searchRoute;
    if (pathWithoutLocale.startsWith("/events")) return eventsRoute;
    return dashboardRoute;
  }, [router.pathname]);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <StyledPaper elevation={3}>
      <StyledBottomNavigation value={currentRoute} showLabels>
        <BottomNavigationAction
          label={t("nav.home")}
          value={dashboardRoute}
          icon={<HomeIcon />}
          onClick={() => handleNavigation(dashboardRoute)}
        />
        <BottomNavigationAction
          label={t("nav.messages")}
          value={messagesRoute}
          icon={<ChatBubbleIcon />}
          onClick={() => handleNavigation(messagesRoute)}
        />
        <BottomNavigationAction
          label={t("nav.communities")}
          value={communitiesRoute}
          icon={<PersonIcon />}
          onClick={() => handleNavigation(communitiesRoute)}
        />
        <BottomNavigationAction
          label={t("nav.map_search")}
          value={searchRoute}
          icon={<SearchIcon />}
          onClick={() => handleNavigation(searchRoute)}
        />
        <BottomNavigationAction
          label={t("nav.events")}
          value={eventsRoute}
          icon={<CalendarIcon />}
          onClick={() => handleNavigation(eventsRoute)}
        />
      </StyledBottomNavigation>
    </StyledPaper>
  );
}
