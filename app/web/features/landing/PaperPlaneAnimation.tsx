import { Box, useMediaQuery } from "@mui/material";
import { theme } from "theme";

export default function PaperPlaneAnimation({
  compact = false,
}: {
  compact?: boolean;
}) {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        aspectRatio: { xs: "1 / 1", sm: "1 / 1", md: "1 / 1" },
        mb: compact ? 0 : 5,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
        "& .dashPrimary": {
          stroke: theme.palette.primary.main,
          animation: "dash 12s linear infinite",
        },
        "& .dashSecondary": {
          stroke: theme.palette.secondary.light,
          animation: "dash 16s linear infinite",
          opacity: 0.85,
        },
        "& .pin": {
          transformOrigin: "center bottom",
          animation: "pulse 3.2s ease-in-out infinite",
        },
        "& .planeFloat": {
          animation: "float 4s ease-in-out infinite",
        },
        "@keyframes dash": {
          to: { strokeDashoffset: -120 },
        },
        "@keyframes pulse": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "@keyframes float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 260"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Stylized travel map with paths and pins"
      >
        <path
          className="dashPrimary"
          d="M70,200 C220,120 400,160 580,100 C700,70 740,90 730,80"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 10"
        />
        <path
          className="dashSecondary"
          d="M70,140 C230,90 360,110 520,60 C640,30 720,40 760,30"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 12"
        />
        <g transform="translate(170,150)">
          <g className="pin">
            <circle r={isMobile ? 16 : 12} fill={theme.palette.primary.main} />
            <path
              d={`M0,${isMobile ? 16 : 12} L${isMobile ? 9 : 7},${(isMobile ? 16 : 12) + (isMobile ? 36 : 28)} L-${isMobile ? 9 : 7},${(isMobile ? 16 : 12) + (isMobile ? 36 : 28)} Z`}
              fill={theme.palette.primary.main}
            />
          </g>
        </g>
        <g transform="translate(600,85)">
          <g className="pin">
            <circle
              r={isMobile ? 14 : 11}
              fill={theme.palette.secondary.main}
            />
            <path
              d={`M0,${isMobile ? 14 : 11} L${isMobile ? 8 : 6},${(isMobile ? 14 : 11) + (isMobile ? 32 : 24)} L-${isMobile ? 8 : 6},${(isMobile ? 14 : 11) + (isMobile ? 32 : 24)} Z`}
              fill={theme.palette.secondary.main}
            />
          </g>
        </g>
        <g
          transform={`translate(390,105) rotate(-12) scale(${isMobile ? 2.0 : 1.6})`}
        >
          <g className="planeFloat">
            <path
              d="M-16,0 L16,0 L6,6 L6,14 L0,9 L-6,14 L-6,6 Z"
              fill={theme.palette.primary.dark}
              opacity="0.9"
            />
          </g>
        </g>
      </svg>
    </Box>
  );
}
