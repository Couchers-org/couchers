import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { IconButton, styled } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

const StyledToggleButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const IconWrapper = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  transition: "transform 0.3s ease",
});

export default function DarkModeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return (
      <StyledToggleButton
        disabled
        size="small"
        aria-label="Loading theme toggle"
      >
        <IconWrapper>
          <LightModeOutlined fontSize="small" sx={{ opacity: 0 }} />
        </IconWrapper>
      </StyledToggleButton>
    );
  }

  const isDark = mode === "dark";

  const handleToggle = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <StyledToggleButton
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      size="small"
    >
      <IconWrapper
        sx={{
          transform: isDark ? "rotate(0deg)" : "rotate(180deg)",
        }}
      >
        {isDark ? (
          <DarkModeOutlined fontSize="small" />
        ) : (
          <LightModeOutlined fontSize="small" />
        )}
      </IconWrapper>
    </StyledToggleButton>
  );
}
