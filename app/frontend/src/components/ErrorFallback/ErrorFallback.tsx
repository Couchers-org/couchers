import { Typography } from "@material-ui/core";
import Actions from "components/Actions";
import Button from "components/Button";
import PageTitle from "components/PageTitle";
import BugReport from "features/BugReport";
import { Link, useHistory } from "react-router-dom";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

import {
  ERROR_HEADING,
  ERROR_INFO,
  GO_TO_HOMEPAGE,
  REFRESH_PAGE,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  report: {
    marginTop: theme.spacing(2),
  },
}));

export default function ErrorFallback() {
  const classes = useStyles();

  const history = useHistory();

  const handleRefresh = () => history.go(0);

  return (
    <>
      <PageTitle>{ERROR_HEADING}</PageTitle>
      <Typography variant="body1">{ERROR_INFO}</Typography>
      <div className={classes.report}>
        <BugReport isResponsive={false} />
      </div>

      <Actions>
        <Link
          to={{ pathname: baseRoute }}
          component={() => <Button variant="outlined">{GO_TO_HOMEPAGE}</Button>}
        />
        <Button onClick={handleRefresh}>{REFRESH_PAGE}</Button>
      </Actions>
    </>
  );
}
