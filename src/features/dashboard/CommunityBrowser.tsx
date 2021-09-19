import { Divider, List, ListItem, ListItemText } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import StyledLink from "components/StyledLink";
import {
  useCommunity,
  useListSubCommunities,
} from "features/communities/hooks";
import { LOAD_MORE, NO_SUB_COMMINITIES } from "features/dashboard/constants";
import { Community } from "proto/communities_pb";
import { useEffect, useRef, useState } from "react";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
  },
  list: {
    minWidth: "10rem",
  },
  loader: {
    margin: theme.spacing("auto", 2),
  },
  selected: {
    fontWeight: "bold",
  },
  emptyState: {
    color: theme.palette.grey[600],
  },
}));

export default function CommunityBrowser() {
  const classes = useStyles();
  const [selected, setSelected] = useState<Community.AsObject[]>([]);

  const globalCommunityQuery = useCommunity(1);

  //react-query doesn't have useInfiniteQueries
  //as a workaround, cache query results
  //and only show "Load more" for last column
  const query = useListSubCommunities(
    selected?.[selected.length - 1]?.communityId || 1
  );
  const [cachedQueryResults, setCachedQueryResults] = useState<
    {
      data: Community.AsObject[];
      hasMore?: boolean;
    }[]
  >([]);

  const lastColumnRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setTimeout(
      () =>
        lastColumnRef.current?.scrollIntoView({
          behavior: "smooth",
          inline: "end",
        }),
      50
    );
  }, [selected]);

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
    <div className={classes.root}>
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
        <div className={classes.loader}>
          <CircularProgress />
        </div>
      ) : query.isSuccess && globalCommunityQuery.isSuccess ? (
        <div ref={lastColumnRef}>
          <BrowserColumn
            parent={
              selected?.[selected.length - 1] ?? globalCommunityQuery.data
            }
            communities={query.data.pages.flatMap(
              (page) => page.communitiesList
            )}
            handleClick={(community) => handleClick(community, selected.length)}
          />
          {query.hasNextPage && (
            <Button
              onClick={() => query.fetchNextPage()}
              loading={query.isFetchingNextPage}
              variant="outlined"
            >
              {LOAD_MORE}
            </Button>
          )}
        </div>
      ) : (
        <Alert severity="error">{query?.error?.message || ""}</Alert>
      )}
    </div>
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
  const classes = useStyles();

  return (
    <List className={classes.list}>
      {parent && (
        <>
          <ListItem
            component={StyledLink}
            to={routeToCommunity(parent.communityId, parent.slug)}
          >
            {parent.name}
          </ListItem>
          <Divider />
        </>
      )}
      {communities.length === 0 ? (
        <ListItem>
          <ListItemText
            primaryTypographyProps={{
              className: classes.emptyState,
              variant: "body2",
            }}
          >
            {NO_SUB_COMMINITIES}
          </ListItemText>
        </ListItem>
      ) : (
        communities.map((community) => (
          <ListItem
            key={community.communityId}
            button
            onClick={() => handleClick(community)}
            aria-selected={community.communityId === selected}
          >
            <ListItemText
              primaryTypographyProps={{
                className:
                  community.communityId === selected
                    ? classes.selected
                    : undefined,
              }}
            >
              {community.name}
            </ListItemText>
          </ListItem>
        ))
      )}
    </List>
  );
}
