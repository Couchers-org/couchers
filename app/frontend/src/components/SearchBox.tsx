import React from "react";
import { makeStyles } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { searchRoute } from "../AppRoutes";
import TextField from "./TextField";
import { useForm } from "react-hook-form";
import { SearchQuery } from "../features/search/constants";

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
        <TextField name="query" label="Search" inputRef={register}></TextField>
      </form>
    </>
  );
}
