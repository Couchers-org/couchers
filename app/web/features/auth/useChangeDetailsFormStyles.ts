import makeStyles from "utils/makeStyles";

const useChangeDetailsFormStyles = makeStyles((theme) => ({
  form: {
    marginTop: theme.spacing(3),
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
  infoText: {
    marginBlockEnd: theme.spacing(1),
  },
}));

export default useChangeDetailsFormStyles;
