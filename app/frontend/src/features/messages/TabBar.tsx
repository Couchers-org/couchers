import { Tab } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { TabList } from "@material-ui/lab";

const useStyles = makeStyles({ root: {} });

export interface TabBarProps<T extends Record<string, string>> {
  value: keyof T;
  setValue: (value: keyof T) => void;
  labels: T;
}

export default function TabBar<T extends Record<string, string>>({ value, setValue, labels }: TabBarProps<T>) {
  const handleChange = (event: any, newValue: keyof T) => {
    setValue(newValue);
  };
  const classes = useStyles();
  return (
    <TabList
      value={value as any}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      centered
    >
      {Object.entries(labels).map(([value, label]) => (
        <Tab key={value} label={label} value={value} />
      ))}
    </TabList>
  );
}
