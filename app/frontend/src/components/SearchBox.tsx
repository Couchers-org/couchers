import { makeStyles } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

import { searchRoute } from "../AppRoutes";
import { SearchQuery } from "../features/search/constants";
import TextField from "./TextField";

const useStyles = makeStyles({
  root: {
    marginLeft: "auto",
  },
});

export default function SearchBox() {
  const classes = useStyles();

  const { register, handleSubmit } = useForm<SearchQuery>();

  const history = useHistory();

  const onSubmit = handleSubmit(({ query }) => {
    history.push(`${searchRoute}/${encodeURIComponent(query)}`);
  });

  return (
    <>
      <form onSubmit={onSubmit} className={classes.root}>
        <TextField
          name="query"
          label="Search"
          inputRef={register}
          minWidth={false}
        ></TextField>
      </form>
    </>
  );
}
