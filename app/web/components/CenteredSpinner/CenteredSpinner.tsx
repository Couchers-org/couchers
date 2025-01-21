import { CircularProgress, styled } from "@mui/material";

interface CenteredSpinnerProps {
  minHeight?: string;
}

interface StyleProps {
  minHeight?: string;
}

const StyledCenteredLoaderContainer = styled("div")<StyleProps>(
  ({ theme, minHeight }) => ({
    minHeight: minHeight,
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: theme.spacing(6),
  }),
);

export default function CenteredSpinner({
  minHeight = "auto",
}: CenteredSpinnerProps) {
  return (
    <StyledCenteredLoaderContainer minHeight={minHeight}>
      <CircularProgress />
    </StyledCenteredLoaderContainer>
  );
}
