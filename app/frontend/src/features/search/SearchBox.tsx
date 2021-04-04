import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import SearchIcon from "@material-ui/icons/Search";
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
        <FormControl>
          <InputLabel htmlFor="search-query">
            Search for users...
          </InputLabel>
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
