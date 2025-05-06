import {
  Divider,
  List,
  ListItem,
  ListItemProps,
  ListItemText,
  styled,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import StyledLink from "components/StyledLink";
import {
  useCommunity,
  useListSubCommunities,
} from "features/communities/hooks";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import { routeToCommunity } from "routes";
import { theme } from "theme";

const OuterWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  width: "100%",
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },
  overflow: "hidden",
}));

const InnerWrapper = styled("div")(({ theme }) => ({
  overflow: "auto",
  maxHeight: "60vh",
  display: "flex",
}));

const StyledList = styled(List)(({ theme }) => ({
  minWidth: "10rem",
}));

const StyledLoader = styled("div")(({ theme }) => ({
  margin: theme.spacing("auto", 2),
}));

const StyledListItem = styled(ListItem)<ListItemProps>(({ theme }) => ({
  background: "transparent",
  border: "none",
  "&:hover": {
    background: "#3135390A",
  },
  "& .selected": {
    fontWeight: "bold",
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(0, 1),
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

export default function CommunityBrowser() {
  const { t } = useTranslation([DASHBOARD]);
  const [selected, setSelected] = useState<Community.AsObject[]>([]);

  const globalCommunityQuery = useCommunity(1);

  //react-query doesn't have useInfiniteQueries
  //as a workaround, cache query results
  //and only show "Load more" for last column
  const query = useListSubCommunities(
    selected?.[selected.length - 1]?.communityId || 1,
  );
  const [cachedQueryResults, setCachedQueryResults] = useState<
    {
      data: Community.AsObject[];
      hasMore?: boolean;
    }[]
  >([]);

  const handleClick = (community: Community.AsObject, level: number) => {
    //if the last column is clicked
    if (level === selected.length) {
      setCachedQueryResults([
        ...cachedQueryResults,
        {
          data: query.data!.pages.flatMap((page) => page.communitiesList),
          hasMore: query.hasNextPage,
        },
      ]);
      setSelected([...selected.slice(0, level), community]);
    } else {
      if (community.communityId === selected[level].communityId) {
        //a previously selected item is clicked, so unselect it
        //treat level = 0 as a special case
        if (level === 0) {
          setSelected([]);
        } else {
          setSelected([...selected.slice(0, level)]);
        }
        setCachedQueryResults(cachedQueryResults.slice(0, level));
      } else {
        //a previously unselected item is clicked
        setSelected([...selected.slice(0, Math.max(level, 0)), community]);
        setCachedQueryResults(cachedQueryResults.slice(0, level + 1));
      }
    }
  };

  return (
    <OuterWrapper>
      <InnerWrapper>
        {cachedQueryResults.map((query, index) => (
          <BrowserColumn
            key={index}
            parent={selected?.[index - 1] ?? globalCommunityQuery.data}
            communities={query.data}
            handleClick={(community) => handleClick(community, index)}
            selected={selected[index]?.communityId}
          />
        ))}
        {query.isLoading ? ( // div prevents overflow scrollbar from spinner
          <StyledLoader>
            <CenteredSpinner />
          </StyledLoader>
        ) : query.isSuccess && globalCommunityQuery.isSuccess ? (
          <div>
            <BrowserColumn
              parent={
                selected?.[selected.length - 1] ?? globalCommunityQuery.data
              }
              communities={query.data.pages.flatMap(
                (page) => page.communitiesList,
              )}
              handleClick={(community) =>
                handleClick(community, selected.length)
              }
            />
            {query.hasNextPage && (
              <Button
                onClick={() => query.fetchNextPage()}
                loading={query.isFetchingNextPage}
                variant="outlined"
              >
                {t("dashboard:load_more")}
              </Button>
            )}
          </div>
        ) : (
          <Alert severity="error">{query?.error?.message || ""}</Alert>
        )}
      </InnerWrapper>
    </OuterWrapper>
  );
}

function BrowserColumn({
  parent,
  communities,
  handleClick,
  selected,
}: {
  parent?: Community.AsObject;
  communities: Community.AsObject[];
  handleClick: (community: Community.AsObject) => void;
  selected?: number;
}) {
  const { t } = useTranslation([DASHBOARD]);

  return (
    <StyledList>
      {parent && (
        <>
          <StyledListItem>
            <StyledLink
              href={routeToCommunity(parent.communityId, parent.slug)}
            >
              <StyledListItemText
                primary={parent.name}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
            </StyledLink>
          </StyledListItem>
          <StyledDivider />
        </>
      )}
      {communities.length === 0 ? (
        <StyledListItem>
          <StyledListItemText
            primaryTypographyProps={{
              className: "emptyState",
              variant: "body2",
            }}
          >
            {t("dashboard:no_sub_communities")}
          </StyledListItemText>
        </StyledListItem>
      ) : (
        communities.map((community) => (
          <StyledListItem
            key={community.communityId}
            component="button"
            onClick={() => handleClick(community)}
            aria-selected={community.communityId === selected}
          >
            <StyledListItemText
              primaryTypographyProps={{
                className:
                  community.communityId === selected ? "selected" : undefined,
              }}
            >
              {community.name}
            </StyledListItemText>
          </StyledListItem>
        ))
      )}
    </StyledList>
  );
}
