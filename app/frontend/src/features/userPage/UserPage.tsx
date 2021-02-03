import { Grid, makeStyles } from "@material-ui/core";
import React from "react";
import { useParams, Link } from "react-router-dom";
import { messagesRoute, profileRoute } from "../../AppRoutes";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import CircularProgress from "../../components/CircularProgress";
import { CouchIcon, EditIcon } from "../../components/Icons";
import AddFriendButton from "../connections/friends/AddFriendButton";
import { User } from "../../pb/api_pb";
import useUserByUsername from "../userQueries/useUserByUsername";
import useCurrentUser from "../userQueries/useCurrentUser";
import UserAbout from "./UserAbout";
import UserGuestbook from "./UserGuestbook";
import UserHeader from "./UserHeader";
import UserPlace from "./UserPlace";
import UserSection from "./UserSection";
import UserSummary from "./UserSummary";
import { useIsMounted, useSafeState } from "../../utils/hooks";
import TextBody from "../../components/TextBody";

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginBottom: theme.spacing(2),
  },
}));

export default function UserPage() {
  const classes = useStyles();
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading, isError, error } = useUserByUsername(
    username,
    true
  );
  const [mutationError, setMutationError] = useSafeState(useIsMounted(), "");
  const isCurrentUser = useCurrentUser().data?.userId === user?.userId;

  return (
    <>
      {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}
      {isError ? (
        <Alert severity="error">{error}</Alert>
      ) : isLoading ? (
        <CircularProgress />
      ) : (
        user && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <UserHeader user={user}>
                {isCurrentUser ? (
                  <Button
                    startIcon={<EditIcon />}
                    component={Link}
                    to={profileRoute}
                    className={classes.actionButton}
                  >
                    Edit your profile
                  </Button>
                ) : user.friends === User.FriendshipStatus.NOT_FRIENDS ? (
                  <AddFriendButton
                    userId={user.userId}
                    setMutationError={setMutationError}
                  />
                ) : user.friends === User.FriendshipStatus.PENDING ? (
                  <TextBody className={classes.actionButton}>
                    Pending friend request...
                  </TextBody>
                ) : null}
                {!isCurrentUser && (
                  <Button
                    startIcon={<CouchIcon />}
                    component={Link}
                    to={`${messagesRoute}/request/new/${user.userId}`}
                    className={classes.actionButton}
                  >
                    Request to stay
                  </Button>
                )}
              </UserHeader>
              <UserSummary user={user} />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <UserSection title="About">
                <UserAbout user={user} />
              </UserSection>
              <UserSection title="My Place">
                <UserPlace user={user} />
              </UserSection>
              <UserSection title="Guestbook">
                <UserGuestbook user={user} />
              </UserSection>
            </Grid>
          </Grid>
        )
      )}
    </>
  );
}
