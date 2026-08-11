import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Alert, Box, Button, IconButton, styled, Typography, useMediaQuery } from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import BetaFlag from "components/BetaFlag";
import { DEFAULT_DRAWER_WIDTH } from "components/ResizeableDrawer";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { SearchUser } from "proto/search_pb";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { theme } from "theme";

import SearchResultUserCard from "./SeachResultUserCard";
import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { MapViews } from "./utils/constants";

interface SearchResultListContentProps {
  error: RpcError | null;
  mapView: MapViews;
  currentRange: string;
  onSetMapView: (view: MapViews) => void;
  onUserCardClick: (userId: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  showAlert: boolean;
  showTopSpace?: boolean;
  totalItems: number | undefined;
  users: SearchUser.AsObject[] | undefined;
}

// Keep in sync with StyledCardWrapper's height.
const DESKTOP_CARD_HEIGHT = DEFAULT_DRAWER_WIDTH - 75;
const DESKTOP_ROW_GAP = 16;
const MOBILE_ESTIMATED_ROW_HEIGHT = 220;
const MIN_COLUMN_WIDTH = DEFAULT_DRAWER_WIDTH - 50;

const ListContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showTopSpace",
})<{ showTopSpace: boolean }>(({ showTopSpace }) => ({
  width: "100%",
  padding: theme.spacing(0.5, 2),
  height: "100%",
  ...(showTopSpace && { paddingTop: theme.spacing(10) }),
}));

// Full-height spacer that the virtual rows are absolutely positioned within.
const UserCardsWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  paddingBottom: theme.spacing(2),
}));

// A row of `columns` cards on desktop, a single card on mobile.
const VirtualRow = styled("div", {
  shouldForwardProp: (prop) => prop !== "columns",
})<{ columns: number }>(({ theme, columns }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  gap: theme.spacing(2),
  justifyContent: "start",
  width: "100%",

  [theme.breakpoints.down("md")]: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
}));

const StyledCardWrapper = styled("div")(({ theme }) => ({
  height: `${DEFAULT_DRAWER_WIDTH - 75}px`,
  display: "flex",

  [theme.breakpoints.down("md")]: {
    height: "auto",
  },
}));

const CenteredRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: theme.spacing(1, 0),
}));

const SearchResultListContent = ({
  error,
  mapView,
  currentRange,
  onSetMapView,
  onUserCardClick,
  scrollRef,
  showAlert,
  showTopSpace = false,
  totalItems,
  users,
}: SearchResultListContentProps) => {
  const { t } = useTranslation([SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { filters, pageNumber, selectedUserId } = useMapSearchState();

  const { setSearchFilters } = useMapSearchActions();

  // Virtualizing by row means we need the column count ourselves rather than leaving it to the grid.
  // Measured in a layout effect so the first paint already has the right count.
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(1);

  useLayoutEffect(() => {
    const element = gridRef.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      setColumns(isMobile || width === 0 ? 1 : Math.max(1, Math.floor(width / MIN_COLUMN_WIDTH)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isMobile]);

  const userList = useMemo(() => users ?? [], [users]);
  const rowCount = Math.ceil(userList.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    // Desktop rows are fixed height. Mobile cards are auto-height and are measured for real, via
    // the library's default measureElement and the ref attached below.
    estimateSize: () => (isMobile ? MOBILE_ESTIMATED_ROW_HEIGHT : DESKTOP_CARD_HEIGHT + DESKTOP_ROW_GAP),
    overscan: 2,
  });

  // Row heights differ between breakpoints, so drop the cached sizes when crossing one.
  useEffect(() => {
    rowVirtualizer.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // A new page of results should start at the top rather than wherever the last one was scrolled to.
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  // Scroll the selected user (e.g. from clicking a map pin) into view.
  useEffect(() => {
    if (selectedUserId === undefined || columns < 1) return;
    const index = userList.findIndex((user) => user.userId === selectedUserId);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(Math.floor(index / columns), { align: "center", behavior: "smooth" });
    }
    // rowVirtualizer identity changes every render; depending on it would re-scroll constantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, columns, userList]);

  const shouldShowSuggestion =
    !showAlert && totalItems !== undefined && filters.showEmptyProfile === false && selectedUserId === undefined;

  const handleIncludeEmptyProfilesClick = () => {
    setSearchFilters({
      ...filters,
      hostingStatus: undefined,
      showEmptyProfile: true,
    });
  };

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
      <CenteredRow>
        {users?.length === 0 && <Typography>{t("search:search_result.no_user_result_message")}</Typography>}
        {(users ?? []).length > 0 && (
          <Typography variant="body2">
            {t("search:search_result.people_range_message", {
              currentRange: currentRange,
              count: totalItems, // "count" name enables plurals
            })}
          </Typography>
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
      </CenteredRow>
      {shouldShowSuggestion && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: theme.spacing(1),
            padding: theme.spacing(1, 0),
            marginBottom: theme.spacing(2),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <BetaFlag />
            <Typography variant="body2">{t("search:search_result.few_results_suggestion")}</Typography>
          </Box>
          <Button variant="contained" size="small" onClick={handleIncludeEmptyProfilesClick}>
            {t("search:search_result.include_empty_profiles_button")}
          </Button>
        </Box>
      )}
      <UserCardsWrapper ref={gridRef} style={{ height: rowCount ? rowVirtualizer.getTotalSize() : undefined }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowUsers = userList.slice(start, start + columns);

          return (
            <VirtualRow
              key={virtualRow.key}
              columns={columns}
              data-index={virtualRow.index}
              ref={isMobile ? rowVirtualizer.measureElement : undefined}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowUsers.map((user, columnIndex) => (
                <StyledCardWrapper key={user?.userId} id={`search-result-${user?.userId}`}>
                  <SearchResultUserCard
                    isHighlighted={selectedUserId === user.userId}
                    onUserCardClick={onUserCardClick}
                    position={start + columnIndex}
                    user={user}
                  />
                </StyledCardWrapper>
              ))}
            </VirtualRow>
          );
        })}
      </UserCardsWrapper>
    </ListContentWrapper>
  );
};

export default SearchResultListContent;
