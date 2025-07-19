import { Box, Paper, styled, Typography } from "@mui/material";
import React from "react";

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
  border: `1px solid ${theme.palette.grey[200]}`,
  backgroundColor: selected
    ? `${theme.palette.primary.main}15`
    : theme.palette.common.white,
  transition: "all 0.2s ease-in-out",
  height: "100%",
  display: "flex",
  flexDirection: "column",

  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: selected
      ? `${theme.palette.primary.main}20`
      : theme.palette.grey[50],
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
  },

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1.5),
    height: "auto",
    display: "block",
  },
}));

const StatusCardContent = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: theme.spacing(2),
  alignItems: "center",
  flex: 1,
  
  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: theme.spacing(1),
  },
  
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "auto 1fr",
    gap: theme.spacing(1.5),
    flex: "none",
  },
}));

const StatusIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: selected ? theme.palette.primary.main : "transparent",
  color: selected ? theme.palette.common.white : theme.palette.primary.main,
  transition: "all 0.2s ease-in-out",

  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },

  [theme.breakpoints.down("md")]: {
    width: 32,
    height: 32,
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
  color: selected ? theme.palette.primary.main : theme.palette.text.primary,
  marginBottom: 0,

  [theme.breakpoints.down("md")]: {
    fontSize: "0.875rem",
  },
}));

const StatusDescription = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  lineHeight: 1.4,

  [theme.breakpoints.down("md")]: {
    fontSize: "0.75rem",
  },
}));

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
              <StatusIcon selected={selectedValue === option.value}>
                {option.icon}
              </StatusIcon>
              <StatusTextContainer>
                <StatusTitle selected={selectedValue === option.value}>
                  {option.title}
                </StatusTitle>
                <StatusDescription>{option.description}</StatusDescription>
              </StatusTextContainer>
            </StatusCardContent>
          </StatusCard>
        ))}
      </StatusCardContainer>
    </Box>
  );
}
