import { Card, Skeleton, styled } from "@mui/material";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  width: "100%",
}));

const StyledLines = styled("div")({
  flex: 1,
  minWidth: 0,
});

/** Placeholder with the shape of a comment, shown while comments load. */
export default function CommentSkeleton() {
  return (
    <StyledCard>
      <Skeleton variant="circular" width="3rem" height="3rem" sx={{ flexShrink: 0 }} />
      <StyledLines>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
      </StyledLines>
    </StyledCard>
  );
}
