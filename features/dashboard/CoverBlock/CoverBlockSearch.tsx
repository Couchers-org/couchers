import { InputAdornment, Typography } from "@material-ui/core";
import { SearchIcon } from "components/Icons";
import TextField from "components/TextField";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  searchBoxContainer: {
    padding: theme.spacing(4, 2, 6, 2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function CoverBlockSearch() {
  const classes = useStyles();
  const searchInputId = "cover-block-search-input"; // @todo: replace with React 18's useId

  return (
    <div className={classes.searchBoxContainer}>
      <Typography
        variant="h2"
        component="label"
        display="block"
        htmlFor={searchInputId}
        paragraph
      >
        Where are you going?
      </Typography>

      <TextField
        id={searchInputId}
        placeholder="Search a location"
        variant="outlined"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}
