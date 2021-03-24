import { makeStyles } from "@material-ui/core";
import TextField from "components/TextField";
import { SearchQuery } from "features/search/constants";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { routeToSearch } from "routes";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    marginLeft: "5%",
  },
  box: {
    "& > .MuiOutlinedInput-root": {
      width: "70%",
      [theme.breakpoints.down("md")]: {
        width: "90%",
      },
    },
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
        <TextField
          className={classes.box}
          id="search-query"
          name="query"
          label="Search"
          inputRef={register}
        ></TextField>
      </form>
    </>
  );
}
