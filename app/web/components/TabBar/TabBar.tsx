import { TabList } from "@mui/lab";
import { SxProps, Tab, styled } from "@mui/material";
import { alpha } from "@mui/material/styles";

const StyledTab = styled(Tab)(({ theme }) => ({
  transition: theme.transitions.create("box-shadow", { duration: 120 }),
  margin: `0 ${theme.spacing(0.75)}`,

  "&:hover, &.Mui-focusVisible": {
    boxShadow: `inset 0 -1px ${alpha(theme.palette.primary.main, 0.18)}`,
  },

  [theme.breakpoints.down("md")]: {
    overflow: "visible",
    margin: `0 ${theme.spacing(1)}`,
  },
}));

export interface TabBarProps<T extends Record<string, React.ReactNode>> {
  ariaLabel: string;
  labels: T;
  setValue: (value: keyof T) => void;
  tabSx?: SxProps;
  tabListSx?: SxProps;
}

const TabBar = <T extends Record<string, React.ReactNode>>({
  ariaLabel,
  setValue,
  labels,
  tabSx,
  tabListSx,
}: TabBarProps<T>) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: keyof T) => {
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
      sx={tabListSx}
    >
      {Object.entries(labels).map(([value, label]) => (
        <StyledTab key={value} label={label} value={value} sx={tabSx} />
      ))}
    </TabList>
  );
};

export default TabBar;
