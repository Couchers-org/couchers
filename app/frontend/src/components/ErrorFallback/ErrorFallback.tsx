import { Box, CardActions, Typography } from "@material-ui/core";
import Button from "components/Button";
import PageTitle from "components/PageTitle";
import BugReport from "features/BugReport";
import { useCallback } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

import {
  ERROR_HEADING,
  ERROR_INFO,
  GO_TO_HOMEPAGE,
  REFRESH_PAGE,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
  },
  report: {
    marginTop: theme.spacing(2),
  },
}));

export default function ErrorFallback() {
  const { actions, report } = useStyles();

  const history = useHistory();

  const handleRefresh = useCallback(() => history.go(0), [history]);

  return (
    <>
      <PageTitle>{ERROR_HEADING}</PageTitle>
      <Typography variant="body1">{ERROR_INFO}</Typography>
      <Box className={report}>
        <BugReport isResponsive={false} />
      </Box>

      <CardActions className={actions}>
        <NavLink exact to={{ pathname: baseRoute }}>
          <Button variant="outlined">{GO_TO_HOMEPAGE}</Button>
        </NavLink>
        <Button onClick={handleRefresh}>{REFRESH_PAGE}</Button>
      </CardActions>
    </>
  );
}
