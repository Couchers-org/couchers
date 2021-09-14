import {
  Divider,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import {
  useCommunity,
  useListSubCommunities,
} from "features/communities/hooks";
import { LOAD_MORE } from "features/dashboard/constants";
import { Community } from "proto/communities_pb";
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
  },
  list: {
    minWidth: "10rem",
  },
  loader: {
    margin: "auto",
  },
  selected: {
    fontWeight: "bold",
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

  const handleClick = (community: Community.AsObject, level: number) => {
    if (level === selected.length) {
      setCachedQueryResults([
        ...cachedQueryResults,
        {
          data: query.data!.pages.flatMap((page) => page.communitiesList),
          hasMore: query.hasNextPage,
        },
      ]);
    } else {
      setCachedQueryResults(cachedQueryResults.slice(0, level + 1));
    }
    setSelected([...selected.slice(0, level), community]);
  };

  return (
    <div className={classes.root}>
      {cachedQueryResults.map((query, index) => (
        <BrowserColumn
          key={index}
          parent={selected?.[index - 1] ?? globalCommunityQuery.data}
          communities={query.data}
          handleClick={(community) => handleClick(community, index)}
          selected={selected[index].communityId}
        />
      ))}
      {query.isError ? (
        <Alert severity="error">{query.error.message}</Alert>
      ) : query.isSuccess && globalCommunityQuery.isSuccess ? (
        <>
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
            >
              {LOAD_MORE}
            </Button>
          )}
        </>
      ) : (
        <CircularProgress className={classes.loader} />
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
            button
            component={StyledLink}
            to={routeToCommunity(parent.communityId, parent.slug)}
          >
            {parent.name}
          </ListItem>
          <Divider />
        </>
      )}
      {communities.map((community) => (
        <ListItem
          key={community.communityId}
          button
          onClick={() => handleClick(community)}
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
      ))}
    </List>
  );
}

function StyledLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} component={MuiLink} children={children} />;
}
