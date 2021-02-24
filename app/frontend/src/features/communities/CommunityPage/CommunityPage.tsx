import { Breadcrumbs, makeStyles, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import {
  CalendarIcon,
  CouchIcon,
  LocationIcon,
} from "../../../components/Icons";
import { routeToCommunity } from "../../../routes";
import {
  useCommunity,
  useListDiscussions,
  useListPlaces,
} from "../useCommunity";
import CircularIconButton from "./CircularIconButton";
import HeaderImage from "./HeaderImage";

const useStyles = makeStyles((theme) => ({
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
  },
}));

export default function CommunityPage() {
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

  /*const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
    //fetchNextPage: fetchNextPlacesPage,
  } = useListPlaces(+communityId);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    //fetchNextPage: fetchNextDiscussionsPage,
  } = useListDiscussions(+communityId);*/

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
    <>
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
        <CircularIconButton
          id="findHostButton"
          label="Find host"
          onClick={() => {}}
        >
          <CouchIcon />
        </CircularIconButton>
        <CircularIconButton id="eventButton" label="Events" onClick={() => {}}>
          <CalendarIcon />
        </CircularIconButton>
        <CircularIconButton
          id="localPointsButton"
          label="Local points"
          onClick={() => {}}
        >
          <LocationIcon />
        </CircularIconButton>
        <CircularIconButton
          id="discussButton"
          label="Find host"
          onClick={() => {}}
        >
          <CouchIcon />
        </CircularIconButton>
        <CircularIconButton
          id="hangoutsButton"
          label="Hangouts"
          onClick={() => {}}
          disabled
        >
          <CouchIcon />
        </CircularIconButton>
      </div>
    </>
  );
}
