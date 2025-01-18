import { TabList } from "@mui/lab";
import { styled, Tab } from "@mui/material";

const StyledTab = styled(Tab)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    overflow: "visible",
    margin: `0 ${theme.spacing(2)}`,
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
      allowScrollButtonsMobile
      variant="scrollable"
    >
      {Object.entries(labels).map(([value, label]) => (
        <StyledTab key={value} label={label} value={value} />
      ))}
    </TabList>
  );
}
