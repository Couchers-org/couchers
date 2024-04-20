import makeStyles from "utils/makeStyles";

export const useNavLinkStyles = makeStyles((theme) => ({
  link: {
    color: theme.palette.text.secondary,
    display: "flex",
    flex: "1",
    fontSize: "2rem",
    maxWidth: "10.5rem",
    padding: theme.spacing(1, 1.5),
  },
  selected: {
    color: theme.palette.secondary.main,
  },
  label: {
    alignSelf: "center",
    marginTop: 0,
  },
  notification: {
    marginRight: "0.8rem",
  },
}));
