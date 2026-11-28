import { KeyboardArrowDown, KeyboardArrowUp, Tune } from "@mui/icons-material";
import { Alert, Box, IconButton, Link, styled, Typography, useMediaQuery } from "@mui/material";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { TFunction } from "i18next";
import { HostingStatus } from "proto/api_pb";
import { SearchUser } from "proto/search_pb";
import { theme } from "theme";

import { ResultsRange } from "./hooks/useUserSearch";
import SearchResultUserCard from "./SeachResultUserCard";
import { useMapSearchState } from "./state/mapSearchContext";
import { initialState } from "./state/mapSearchReducers";
import { MapViews } from "./utils/constants";
import { countActiveFilters } from "./utils/mapUtils";

interface SearchResultListContentProps {
  error: RpcError | null;
  mapView: MapViews;
  currentRange: ResultsRange;
  onOpenFilters: () => void;
  onSetMapView: (view: MapViews) => void;
  onUserCardClick: (userId: number) => void;
  showAlert: boolean;
  showTopSpace?: boolean;
  totalFilteredItems: number | undefined;
  totalUnfilteredItems: number | undefined;
  users: SearchUser.AsObject[] | undefined;
}

const ListContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showTopSpace",
})<{ showTopSpace: boolean }>(({ showTopSpace }) => ({
  width: "100%",
  padding: theme.spacing(0.5, 2),
  height: "100%",
  ...(showTopSpace && { paddingTop: theme.spacing(10) }),
}));

const UserCardsWrapper = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fill, minmax(${DEFAULT_DRAWER_WIDTH - 50}px, 1fr))`, // Responsive columns
  gap: theme.spacing(2),
  justifyContent: "start",
  width: "100%",
  paddingBottom: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
}));

const StyledCardWrapper = styled("div")(({ theme }) => ({
  height: `${DEFAULT_DRAWER_WIDTH - 75}px`,
  display: "flex",
  // space around the highlighted card when it's scrolled into view
  scrollMarginBlock: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    height: "auto",
  },
}));

const SummaryRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: theme.spacing(1, 0),
}));

interface ResultsSummary {
  // how many members match, e.g. "1,240 members in Berlin"
  matching: string;
  // everyone in the area, when filters hide some, e.g. "of 5,090 members in this area"
  areaTotal: string | null;
}

/** The results line: how many members match, and how many are in the area when filters hide some. */
function getResultsSummary({
  t,
  numResults,
  totalFilteredItems,
  totalUnfilteredItems,
  searchKeyword,
  placeName,
  onlyHosts,
}: {
  t: TFunction;
  numResults: number | undefined;
  totalFilteredItems: number;
  totalUnfilteredItems: number;
  searchKeyword: string | undefined;
  placeName: string | undefined;
  // true when the hosting filter only lets through people who can or may host
  onlyHosts: boolean;
}): ResultsSummary | null {
  if (numResults === undefined) return null;
  const where = placeName ? "in_place" : "in_area";
  const who = onlyHosts ? "hosts" : "members";

  if (numResults === 0) {
    if (totalUnfilteredItems === 0 || searchKeyword) {
      return { matching: t("search:search_result.no_user_result_message"), areaTotal: null };
    }
    return {
      matching: t(`search:search_result.results_summary.no_matching_${who}_message`),
      areaTotal: t(`search:search_result.results_summary.area_total_${where}_message`, {
        count: totalUnfilteredItems,
        place_name: placeName,
      }),
    };
  }
  if (searchKeyword) {
    return {
      matching: t("search:search_result.results_summary.keyword_matches_message", {
        count: totalFilteredItems,
        search_keyword: searchKeyword,
      }),
      areaTotal: null,
    };
  }
  return {
    matching: t(`search:search_result.results_summary.matching_${who}_${where}_message`, {
      count: totalFilteredItems,
      place_name: placeName,
    }),
    areaTotal:
      totalUnfilteredItems > totalFilteredItems
        ? t("search:search_result.results_summary.out_of_area_total_message", { count: totalUnfilteredItems })
        : null,
  };
}

const SearchResultListContent = ({
  error,
  mapView,
  currentRange,
  onOpenFilters,
  onSetMapView,
  onUserCardClick,
  showAlert,
  showTopSpace = false,
  totalFilteredItems,
  totalUnfilteredItems,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { filters, selectedUserId, search, uiOnly } = useMapSearchState();

  const isOnlyHostsFilter =
    !!filters.hostingStatus?.length &&
    filters.hostingStatus.every(
      (status) => status === HostingStatus.HOSTING_STATUS_CAN_HOST || status === HostingStatus.HOSTING_STATUS_MAYBE,
    );
  const activeFilterCount = countActiveFilters(filters, initialState.filters);

  const summary = getResultsSummary({
    t,
    numResults: users?.length,
    totalFilteredItems: totalFilteredItems ?? 0,
    totalUnfilteredItems: totalUnfilteredItems ?? 0,
    searchKeyword: search.bbox ? undefined : search.query,
    placeName: uiOnly.placeName,
    onlyHosts: isOnlyHostsFilter,
  });

  // fills the grey line when there's no area total, so it looks the same with and without one
  const showPageRange = (users ?? []).length > 0 && !summary?.areaTotal;

  return (
    <ListContentWrapper showTopSpace={showTopSpace}>
      {error && (
        <Alert
          severity="error"
          sx={{
            height: "fit-content",
            width: "100%",
            marginBottom: theme.spacing(2),
          }}
        >
          {t("search:error_loading_users")}
        </Alert>
      )}
      {showAlert && (
        <Alert
          severity="info"
          sx={{
            height: "fit-content",
            width: "100%",
            marginTop: theme.spacing(1),
          }}
        >
          {t("search:choose_search_criteria")}
        </Alert>
      )}
      <SummaryRow>
        {summary && (
          // the mobile expand/collapse button sits over the right of this row
          <Box sx={{ flex: 1, minWidth: 0, paddingRight: isMobile ? 5 : 0 }}>
            <Typography component="h2" sx={{ fontSize: "1rem", fontWeight: 700 }}>
              {summary.matching}
            </Typography>
            {/* the grey line: area total, active filters (opens them) and page position, whichever apply */}
            {(summary.areaTotal || activeFilterCount > 0 || showPageRange) && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.5 }}
              >
                {[
                  summary.areaTotal && <span key="area-total">{summary.areaTotal}</span>,
                  activeFilterCount > 0 && (
                    <Link
                      key="filters"
                      component="button"
                      variant="body2"
                      underline="hover"
                      onClick={onOpenFilters}
                      sx={{
                        fontWeight: 500,
                        lineHeight: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.25,
                      }}
                    >
                      <Tune sx={{ fontSize: 16 }} aria-hidden />
                      {t("search:search_result.results_summary.active_filters_link", { count: activeFilterCount })}
                    </Link>
                  ),
                  showPageRange && (
                    <span key="page-range">
                      {t("search:search_result.results_summary.page_range_message", {
                        first_result_number: currentRange.firstResultNumber,
                        last_result_number: currentRange.lastResultNumber,
                      })}
                    </span>
                  ),
                ]
                  .filter(Boolean)
                  .flatMap((part, index) =>
                    index === 0
                      ? [part]
                      : [
                          <span key={`separator-${index}`} aria-hidden>
                            ·
                          </span>,
                          part,
                        ],
                  )}
              </Typography>
            )}
          </Box>
        )}

        {isMobile && (
          <IconButton
            onClick={() => {
              if (mapView === MapViews.LIST_ONLY) {
                onSetMapView(MapViews.MAP_AND_LIST);
              } else {
                onSetMapView(MapViews.LIST_ONLY);
              }
            }}
            aria-label={t(`global:${mapView === MapViews.LIST_ONLY ? "retract" : "expand"}`)}
            sx={{
              fontSize: "24px",
              backgroundColor: "var(--mui-palette-background-paper)",
              border: `1px solid var(--mui-palette-divider)`,
              height: "25px",
              width: "25px",
              position: "absolute",
              top: theme.spacing(1),
              right: theme.spacing(2),
              zIndex: 10,

              "&:hover": {
                backgroundColor: "var(--mui-palette-background-paper)",
              },
            }}
          >
            {mapView === MapViews.LIST_ONLY ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
          </IconButton>
        )}
      </SummaryRow>
      <UserCardsWrapper>
        {users?.map((user, index) => (
          <StyledCardWrapper key={user?.userId} id={`search-result-${user?.userId}`}>
            <SearchResultUserCard
              isHighlighted={selectedUserId === user.userId}
              onUserCardClick={onUserCardClick}
              position={index}
              user={user}
            />
          </StyledCardWrapper>
        ))}
      </UserCardsWrapper>
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
