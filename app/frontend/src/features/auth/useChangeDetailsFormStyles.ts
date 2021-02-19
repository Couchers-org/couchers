import { makeStyles } from "@material-ui/core";

const useChangeDetailsFormStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
  infoText: {
    marginBlockEnd: theme.spacing(1),
  },
}));

export default useChangeDetailsFormStyles;
