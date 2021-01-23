import { Tab, Tabs } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles((theme) => ({
  tabRoot: {
    minWidth: theme.spacing(25),
  },
}));

export interface TabBarProps<T extends Record<string, React.ReactNode>> {
  value: keyof T;
  setValue: (value: keyof T) => void;
  labels: T;
}

export default function TabBar<T extends Record<string, React.ReactNode>>({
  value,
  setValue,
  labels,
}: TabBarProps<T>) {
  const handleChange = (event: any, newValue: keyof T) => {
    setValue(newValue);
  };
  const classes = useStyles();
  return (
    <Tabs
      value={value as any}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      scrollButtons="auto"
      variant="scrollable"
    >
      {Object.entries(labels).map(([value, label]) => (
        <Tab
          classes={{ root: classes.tabRoot }}
          key={value}
          label={label}
          value={value}
        />
      ))}
    </Tabs>
  );
}
