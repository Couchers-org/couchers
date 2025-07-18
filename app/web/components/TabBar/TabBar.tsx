import { TabList } from "@mui/lab";
import { styled, Tab } from "@mui/material";

const StyledTab = styled(Tab)(({ theme }) => ({
  fontSize: "1.125rem",
  fontWeight: 600,
  textTransform: "none",
  minHeight: 56,
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.spacing(1.5, 1.5, 0, 0),
  transition: "all 0.2s ease-in-out",
  color: theme.palette.text.secondary,

  "&.Mui-selected": {
    color: theme.palette.primary.main,
    borderBottom: `3px solid ${theme.palette.primary.main}`,
    fontWeight: 700,
  },

  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.grey[50],
  },

  [theme.breakpoints.down("md")]: {
    overflow: "visible",
    margin: `0 ${theme.spacing(1)}`,
    fontSize: "1rem",
    padding: theme.spacing(1, 2),
    minHeight: 48,
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
      sx={{
        minHeight: 64,
        "& .MuiTabs-indicator": {
          display: "none",
        },
      }}
    >
      {Object.entries(labels).map(([value, label]) => (
        <StyledTab key={value} label={label} value={value} />
      ))}
    </TabList>
  );
}
