import {
  Breadcrumbs,
  Dialog,
  DialogContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Link, useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import NewComment from "../../../components/Comments/NewComment";
import HorizontalScroller from "../../../components/HorizontalScroller";
import IconButton from "../../../components/IconButton";
import {
  AddIcon,
  CalendarIcon,
  CouchIcon,
  EmailIcon,
  InfoIcon,
  LocationIcon,
  MoreIcon,
} from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import {
  routeToCommunity,
  routeToCommunityDiscussions,
  routeToCommunityEvents,
  routeToCommunityPlaces,
} from "../../../routes";
import {
  useCommunity,
  useListDiscussions,
  useListPlaces,
  useNewDiscussionMutation,
} from "../useCommunity";
import CircularIconButton from "./CircularIconButton";
import DiscussionCard from "./DiscussionCard";
import EventCard from "./EventCard";
import HeaderImage from "./HeaderImage";
import PlaceCard from "./PlaceCard";
import SectionTitle from "./SectionTitle";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  center: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  header: {
    marginBottom: theme.spacing(1),
  },
  breadcrumbs: {
    "& ol": {
      justifyContent: "center",
    },
  },
  title: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  description: {
    marginBottom: theme.spacing(1),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: theme.spacing(1),
  },
  cardContainer: {
    [theme.breakpoints.down("sm")]: {
      width: "100vw",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
    },
  },
  placeCard: {
    width: 140,
  },
  eventCard: {
    width: 120,
  },
  discussionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newPostButton: {
    margin: theme.spacing(1),
  },
  discussionsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    "& > *": {
      width: "100%",
      [theme.breakpoints.up("md")]: {
        width: `calc(33.33% - ${theme.spacing(1)})`,
      },
      [theme.breakpoints.up("sm")]: {
        width: `calc(50% - ${theme.spacing(1)})`,
      },
    },
  },
  discussionCard: {
    marginBottom: theme.spacing(1),
  },
}));

export default function CommunityPage() {
  //temporary
  const [isNewCommentOpen, setIsNewCommentOpen] = useState(false);
  const classes = useStyles();

  const { communityId, communitySlug } = useParams<{
    communityId: string;
    communitySlug?: string;
  }>();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(+communityId);

  const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
    hasNextPage: placesHasNextPage,
  } = useListPlaces(+communityId);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    hasNextPage: discussionsHasNextPage,
  } = useListDiscussions(+communityId);

  const queryClient = useQueryClient();
  const newDiscussionMutation = useNewDiscussionMutation(queryClient);

  const history = useHistory();
  useEffect(() => {
    if (!community) return;
    if (community.slug !== communitySlug) {
      // if the address is wrong, redirect to the right place
      history.replace(routeToCommunity(community.communityId, community.slug));
    }
  }, [community, communitySlug, history]);

  if (!communityId)
    return <Alert severity="error">Invalid community id.</Alert>;

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || "Error loading the community."}
      </Alert>
    );

  return (
    <div className={classes.root}>
      <HeaderImage community={community} className={classes.header} />
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
        {community.parentsList
          .filter((parent) => !!parent.community)
          .map((parent) => (
            <Link
              to={routeToCommunity(
                parent.community!.communityId,
                parent.community!.slug
              )}
              key={`breadcrumb-${parent.community?.communityId}`}
            >
              {parent.community!.name}
            </Link>
          ))}
      </Breadcrumbs>
      <Typography variant="h1" align="center" className={classes.title}>
        Welcome to {community.name}!
      </Typography>
      <Typography
        variant="body2"
        align="center"
        className={classes.description}
      >
        {community.description} More tips and information
        <Link to="#"> here.</Link>
      </Typography>
      <div className={classes.buttonContainer}>
        <CircularIconButton id="findHostButton" label="Find host">
          <CouchIcon />
        </CircularIconButton>
        <CircularIconButton
          id="eventButton"
          label="Events"
          linkTo={routeToCommunityEvents(community.communityId, community.slug)}
        >
          <CalendarIcon />
        </CircularIconButton>
        <CircularIconButton id="localPointsButton" label="Local points">
          <LocationIcon />
        </CircularIconButton>
        <CircularIconButton
          id="discussButton"
          label="Discussions"
          linkTo={routeToCommunityDiscussions(
            community.communityId,
            community.slug
          )}
        >
          <EmailIcon />
        </CircularIconButton>
        <CircularIconButton id="hangoutsButton" label="Hangouts" disabled>
          <CouchIcon />
        </CircularIconButton>
      </div>

      <SectionTitle icon={<InfoIcon />}>Places</SectionTitle>
      {placesError && <Alert severity="error">{placesError.message}</Alert>}
      {isPlacesLoading && <CircularProgress />}
      <HorizontalScroller className={classes.cardContainer}>
        {
          //Is there a better way to check for empty state?
          places &&
          places.pages.length > 0 &&
          places.pages[0].placesList.length === 0 ? (
            <TextBody>No places to show yet.</TextBody>
          ) : (
            places?.pages
              .flatMap((res) => res.placesList)
              .map((place) => (
                <PlaceCard
                  place={place}
                  className={classes.placeCard}
                  key={`placecard-${place.pageId}`}
                />
              ))
          )
        }
        {placesHasNextPage && (
          <Link
            to={routeToCommunityPlaces(community.communityId, community.slug)}
          >
            <IconButton aria-label="See more places">
              <MoreIcon />
            </IconButton>
          </Link>
        )}
      </HorizontalScroller>

      <SectionTitle icon={<CalendarIcon />}>Events</SectionTitle>
      {
        //{eventsError && <Alert severity="error">{eventsError.message}</Alert>}
        //isEventsLoading && <CircularProgress />
      }
      <HorizontalScroller className={classes.cardContainer}>
        {[0, 1, 2, 3].length === 0 ? (
          <TextBody>No events at the moment.</TextBody>
        ) : (
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
            <EventCard
              key={`eventcard-${i}`}
              event={{
                title: Math.random() > 0.5 ? "Placeholder event" : "Place",
                creatorName: "Bot",
                location: "Amsterdam",
                startTime: { seconds: Date.now() / 1000, nanos: 0 },
              }}
              className={classes.eventCard}
            />
          ))
        )}
        {true && ( //eventsHasNextPage && (
          <Link
            to={routeToCommunityEvents(community.communityId, community.slug)}
          >
            <IconButton aria-label="See more events">
              <MoreIcon />
            </IconButton>
          </Link>
        )}
      </HorizontalScroller>

      <div className={classes.discussionsHeader}>
        <SectionTitle icon={<EmailIcon />}>
          {`${community.name} discussions`}
        </SectionTitle>
        <IconButton
          aria-label="New post"
          onClick={() => setIsNewCommentOpen(true)}
        >
          <AddIcon />
        </IconButton>
      </div>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      {
        //This comment adding dialog is temporary
      }
      <Dialog
        open={isNewCommentOpen}
        onClose={() => setIsNewCommentOpen(false)}
      >
        <DialogContent>
          {newDiscussionMutation.error && (
            <Alert severity="error">
              {newDiscussionMutation.error.message}
            </Alert>
          )}
          <NewComment
            onComment={async (content) =>
              newDiscussionMutation.mutate({
                title: "test",
                content,
                ownerCommunityId: community.communityId,
              })
            }
          />
        </DialogContent>
      </Dialog>
      <div className={classes.discussionsContainer}>
        {isDiscussionsLoading && <CircularProgress />}
        {discussions &&
        discussions.pages.length > 0 &&
        discussions.pages[0].discussionsList.length === 0 ? (
          <TextBody>No discussions to show yet.</TextBody>
        ) : (
          discussions?.pages
            .flatMap((res) => res.discussionsList)
            .map((discussion) => (
              <DiscussionCard
                discussion={discussion}
                className={classes.discussionCard}
                key={`discussioncard-${discussion.threadId}`}
              />
            ))
        )}
        {discussionsHasNextPage && (
          <Link
            to={routeToCommunityDiscussions(
              community.communityId,
              community.slug
            )}
          >
            <IconButton aria-label="See more discussions">
              <MoreIcon />
            </IconButton>
          </Link>
        )}
      </div>
    </div>
  );
}
