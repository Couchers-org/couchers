import { TabList } from "@mui/lab";
import { styled, SxProps, Tab } from "@mui/material";
import { alpha } from "@mui/material/styles";

const StyledTab = styled(Tab)(({ theme }) => ({
  transition: theme.transitions.create("box-shadow", { duration: 120 }),
  margin: `0 ${theme.spacing(0.75)}`,

  "&:hover, &.Mui-focusVisible": {
    boxShadow: `inset 0 -1px ${alpha(theme.palette.primary.main, 0.18)}`,
  },

  [theme.breakpoints.down("md")]: {
    overflow: "visible",
    margin: `0 ${theme.spacing(0.25)}`,
    minWidth: "auto",
    padding: `6px 8px`,
  },
}));

interface TabBarProps<T extends Record<string, React.ReactNode>> {
  ariaLabel: string;
  labels: T;
  setValue: (value: keyof T) => void;
  tabSx?: SxProps;
  tabListSx?: SxProps;
}

export default function TabBar<T extends Record<string, React.ReactNode>>({
  ariaLabel,
  setValue,
  labels,
  tabSx,
  tabListSx,
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
      scrollButtons
      allowScrollButtonsMobile
      variant="scrollable"
      sx={tabListSx}
    >
      {Object.entries(labels).map(([value, label]) => (
        <StyledTab key={value} label={label} value={value} sx={tabSx} />
      ))}
    </TabList>
  );
}
