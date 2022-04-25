import { makeStyles } from "@material-ui/core";

const useAccordionStyles = makeStyles((theme) => ({
  accordion: {
    marginBlockStart: theme.spacing(2),
    "& .MuiAccordionSummary-content": {
      display: "grid",
      alignItems: "baseline",
      gridTemplateColumns: "repeat(auto-fit, 100%)",
      columnGap: theme.spacing(2),
      [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "1fr 2fr",
      },
    },
    "& .MuiAccordionDetails-root": {
      display: "block",
    },
  },
  accordionSubtitle: {
    ...theme.typography.h3,
    color: theme.palette.grey[600],
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
}));

export default useAccordionStyles;
