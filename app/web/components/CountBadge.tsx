import { Box } from "@mui/material";

interface CountBadgeProps {
  count: number;
}

export default function CountBadge({ count }: CountBadgeProps) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: 12,
        fontWeight: 700,
        color: "var(--mui-palette-text-secondary)",
        background: "var(--mui-palette-grey-50)",
        borderRadius: 999,
        px: 1.125,
        lineHeight: "20px",
        display: "inline-block",
      }}
    >
      {count}
    </Box>
  );
}
