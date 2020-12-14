import { Tab, Tabs } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles({ root: {} });

export interface TabBarProps<T extends Record<string, string>> {
  value: keyof T;
  setValue: (value: keyof T) => void;
  labels: T;
}

export default function TabBar<T extends Record<string, string>>({
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
        <Tab key={value} label={label} value={value} />
      ))}
    </Tabs>
  );
}
