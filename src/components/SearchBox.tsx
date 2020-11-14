import React, { useState } from "react";
import { makeStyles } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { searchRoute } from "../AppRoutes";
import classNames from "classnames";
import TextField from "./TextField";

const useStyles = makeStyles({
  root: {
    marginLeft: "auto",
  },
});

export default function SearchBox() {
  const classes = useStyles();

  const [query, setQuery] = useState("");

  const history = useHistory();

  const onSubmit = () => {
    history.push(`${searchRoute}/${query}`);
  };

  return (
    <>
      <form onSubmit={onSubmit} className={classNames(classes.root)}>
        <TextField
          variant="outlined"
          label="Search"
          onChange={(event) => setQuery(event.target.value)}
        ></TextField>
      </form>
    </>
  );
}
