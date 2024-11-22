import { TabList } from "@mui/lab";
import { Tab } from "@mui/material";
import makeStyles from "utils/makeStyles";

export const useStyles = makeStyles((theme) => ({
  messagesTab: {
    [theme.breakpoints.down("md")]: {
      overflow: "visible",
      margin: `0 ${theme.spacing(2)}`,
    },
  },
}));

export interface TabBarProps<T extends Record<string, React.ReactNode>> {
  ariaLabel: string;
  labels: T;
  setValue: (value: keyof T) => void;
}

export default function TabBar<T extends Record<string, React.ReactNode>>({
  ariaLabel,
  setValue,
  labels,
}: TabBarProps<T>) {
  const classes = useStyles();

  const handleChange = (event: React.SyntheticEvent, newValue: keyof T) => {
    setValue(newValue);
  };

  return (
    <TabList
      aria-label={ariaLabel}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      scrollButtons="auto"
      variant="scrollable"
    >
      {Object.entries(labels).map(([value, label]) => (
        <Tab
          key={value}
          label={label}
          value={value}
          className={classes.messagesTab}
        />
      ))}
    </TabList>
  );
}
