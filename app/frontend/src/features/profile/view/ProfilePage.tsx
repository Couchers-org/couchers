import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import Overview from "features/profile/view/Overview";
import UserCard from "features/user/UserCard";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useHistory } from "react-router-dom";
import { routeToProfile } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(3),
    [theme.breakpoints.up("md")]: {
      display: "flex",
      maxWidth: theme.breakpoints.values.lg,
      margin: "0 auto",
      paddingTop: 0,
    },
  },
}));

export default function ProfilePage() {
  const classes = useStyles();
  const history = useHistory();

  const { data: user, error, isLoading } = useCurrentUser();

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview
              setIsRequesting={() => {
                /* TODO: not needed here*/
              }}
            />
            <UserCard
              onTabChange={(newTab) => {
                history.push(routeToProfile(newTab));
              }}
            />
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
