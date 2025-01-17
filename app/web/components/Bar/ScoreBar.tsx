import {
  Container,
  ContainerProps,
  LinearProgress,
  styled,
  Typography,
} from "@mui/material";
import React from "react";

interface ScoreBarProps extends ContainerProps {
  value: number;
}

const StyledContainer = styled(Container)(({ theme }) => ({
  height: theme.spacing(3),
  marginInlineStart: 0,
  maxWidth: 300,
  position: "relative",
  width: "100%",
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  height: "100%",
  position: "absolute",
  width: "100%",
}));

const StyledScoreBarLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  lineHeight: theme.spacing(3),
  paddingLeft: theme.spacing(2),
  position: "absolute",
  verticalAlign: "middle",
  width: "100%",
  fontSize: "0.75rem",
}));

export default function SearchResult({ value, children }: ScoreBarProps) {
  return process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED ? (
    <StyledContainer disableGutters>
      <StyledLinearProgress variant="determinate" value={value} />
      <StyledScoreBarLabel noWrap>{children}</StyledScoreBarLabel>
    </StyledContainer>
  ) : null;
}
