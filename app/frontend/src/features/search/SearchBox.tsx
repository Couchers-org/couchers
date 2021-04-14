import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { SearchQuery } from "features/search/constants";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { routeToSearch } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    marginLeft: "5%",
  },
  box: {
    width: "70%",
    [theme.breakpoints.down("md")]: {
      width: "90%",
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
        <FormControl className={classes.box}>
          <InputLabel htmlFor="search-query">Search for a user...</InputLabel>
          <Input
            id="search-query"
            type="text"
            inputRef={register}
            name="query"
            endAdornment={
              <InputAdornment position="end">
                <IconButton aria-label="search" onClick={onSubmit}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      </form>
    </>
  );
}
