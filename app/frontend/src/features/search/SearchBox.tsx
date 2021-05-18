import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { routeToSearch } from "routes";

export default function SearchBox({ className }: { className?: string }) {
  const { register, handleSubmit } = useForm<{ query: string }>();

  const history = useHistory();

  const onSubmit = handleSubmit(({ query }) => {
    history.push(routeToSearch(encodeURIComponent(query)));
  });

  return (
    <>
      <form onSubmit={onSubmit} className={className}>
        <FormControl fullWidth>
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
