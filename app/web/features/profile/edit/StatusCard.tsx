import { Box, Paper, styled, Typography } from "@mui/material";
import React from "react";

interface StatusOption<T> {
  value: T;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface StatusCardGroupProps<T> {
  title: string;
  options: StatusOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

const StatusCardContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),

  [theme.breakpoints.up("md")]: {
    gridAutoRows: "1fr",
  },
}));

const StatusCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2),
  cursor: "pointer",
  border: selected ? `2px solid var(--mui-palette-primary-main)` : `1px solid var(--mui-palette-grey-200)`,
  backgroundColor: selected ? `var(--mui-palette-primary-main)15` : "var(--mui-palette-background-paper)",
  transition: "all 0.2s ease-in-out",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100px",

  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    backgroundColor: selected ? "var(--mui-palette-primary-main)20" : "var(--mui-palette-grey-50)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
  },

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1.5),
    height: "auto",
    minHeight: "75px",
  },
}));

const StatusCardContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(1),
  color: "var(--mui-palette-text-primary)",
  "& svg": {
    fill: "var(--mui-palette-text-primary)",
  },

  [theme.breakpoints.down("md")]: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: theme.spacing(1.5),
    flex: "none",
  },
}));

const StatusTextContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "40% 60%",
  gap: theme.spacing(1),
  alignItems: "center",

  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "40% 60%",
    gap: theme.spacing(1),
  },
}));

const StatusTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  fontSize: "1rem",
  fontWeight: 600,
  color: selected ? "var(--mui-palette-primary-main)" : "var(--mui-palette-text-primary)",
  marginBottom: 0,
  textAlign: "left",

  [theme.breakpoints.down("md")]: {
    fontSize: "0.875rem",
  },
}));

const StatusDescription = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  fontSize: "0.75rem",
  lineHeight: 1.4,
  color: "var(--mui-palette-text-secondary)",

  [theme.breakpoints.down("md")]: {
    fontSize: "0.75rem",
    textAlign: "left",
  },
}));

export default function StatusCardGroup<T extends string | number>({
  title,
  options,
  selectedValue,
  onSelect,
}: StatusCardGroupProps<T>) {
  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
      <StatusCardContainer>
        {options.map((option) => (
          <StatusCard
            key={option.value}
            selected={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
          >
            <StatusCardContent>
              {option.icon}
              <StatusTextContainer>
                <StatusTitle selected={selectedValue === option.value}>{option.title}</StatusTitle>
                <StatusDescription>{option.description}</StatusDescription>
              </StatusTextContainer>
            </StatusCardContent>
          </StatusCard>
        ))}
      </StatusCardContainer>
    </Box>
  );
}
