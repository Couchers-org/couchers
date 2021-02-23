import { makeStyles } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

import TextField from "../../components/TextField";
import { routeToSearch } from "../../routes";
import { SearchQuery } from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
  },
}));

export default function SearchBox() {
  const classes = useStyles();

  const { register, handleSubmit } = useForm<SearchQuery>();

  const history = useHistory();

  const onSubmit = handleSubmit(({ query }) => {
    history.push(routeToSearch(encodeURIComponent(query)));
  });

  return (
    <>
      <form onSubmit={onSubmit} className={classes.root}>
        <TextField id="search-query" name="query" label="Search" inputRef={register}></TextField>
      </form>
    </>
  );
}
