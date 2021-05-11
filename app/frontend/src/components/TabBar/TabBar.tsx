import { Tab } from "@material-ui/core";
import { TabList } from "@material-ui/lab";
import makeStyles from "utils/makeStyles";

export const useStyles = makeStyles((theme) => ({
  messagesTab: {
    [theme.breakpoints.down("sm")]: {
      overflow: "visible",
      margin: `0 ${theme.spacing(2)}`,
    },
  },
}));

export interface TabBarProps<T extends Record<string, React.ReactNode>> {
  ariaLabel: string;
  labels: T;
  setValue: (value: keyof T) => void;
  value: keyof T;
}

export default function TabBar<T extends Record<string, React.ReactNode>>({
  ariaLabel,
  value,
  setValue,
  labels,
}: TabBarProps<T>) {
  const classes = useStyles();
  const handleChange = (event: any, newValue: keyof T) => {
    setValue(newValue);
  };
  return (
    <TabList
      aria-label={ariaLabel}
      value={value as any}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      scrollButtons="auto"
      variant="scrollable"
    >
      {Object.entries(labels)
        .filter(([isDefined]) => !!isDefined)
        .map(([value, label]) => (
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
