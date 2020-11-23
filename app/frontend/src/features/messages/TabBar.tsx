import { Tab } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { labels } from "./constants";
import { TabList } from "@material-ui/lab";

const useStyles = makeStyles({ root: {} });

export interface TabBarProps {
  value: string;
  setValue: (value: string) => void;
}

export default function TabBar({ value, setValue }: TabBarProps) {
  const handleChange = (event: any, newValue: string) => {
    setValue(newValue);
  };
  const classes = useStyles();
  return (
    <TabList
      value={value}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      centered
    >
      <Tab label={labels.TAB_ALL} value="ALL" />
      <Tab label={labels.TAB_GROUPCHATS} value="GROUPCHATS" />
      <Tab label={labels.TAB_HOSTING} value="HOSTING" />
      <Tab label={labels.TAB_SURFING} value="SURFING" />
      <Tab label={labels.TAB_MEET} value="MEET" />
      <Tab label={labels.TAB_ARCHIVED} value="ARCHIVED" />
    </TabList>
  );
}
