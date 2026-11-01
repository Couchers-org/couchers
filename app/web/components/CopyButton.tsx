import { ContentCopyOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import IconButton from "components/IconButton";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import useCopyToClipboard from "utils/useCopyToClipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const { t } = useTranslation(GLOBAL);
  const { copy, status } = useCopyToClipboard();
  const a11yLabel = label ?? t("global:copy_button.a11y");

  return (
    // the message sits beside the icon without taking space, so surrounding content doesn't shift
    <Box component="span" sx={{ position: "relative", display: "inline-flex" }}>
      <Tooltip title={a11yLabel} placement="top" arrow>
        <IconButton size="small" color="primary" aria-label={a11yLabel} onClick={() => copy(text)}>
          <ContentCopyOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Typography
        component="span"
        role="status"
        sx={{
          position: "absolute",
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          fontSize: "0.8125rem",
          color: status === "failed" ? "var(--mui-palette-error-main)" : "var(--mui-palette-text-secondary)",
        }}
      >
        {status === "copied" && t("global:copy_button.copied_message")}
        {status === "failed" && t("global:copy_button.failed_message")}
      </Typography>
    </Box>
  );
}
