import { styled, Typography } from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { CouchersIcon } from "components/Icons";
import ReportButton from "components/Navigation/ReportButton";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { baseRoute } from "routes";

// An error boundary replaces everything it wraps, including the navigation and
// the usual page container, so this screen has to lay itself out.
const StyledRoot = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // See the --vh workaround in pages/_app.tsx for why this isn't 100vh.
  minHeight: "calc(var(--vh, 1vh) * 100)",
  padding: theme.spacing(4, 2),
}));

const StyledPanel = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(2),
  width: "100%",
  maxWidth: "32rem",
  padding: theme.spacing(5, 3),
  backgroundColor: "var(--mui-palette-background-paper)",
  // In dark mode `paper` and `default` are the same colour, so the border is
  // what separates the panel from the page behind it.
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: theme.shape.borderRadius * 2,
}));

const StyledMark = styled(CouchersIcon)({
  fontSize: "3rem",
  color: "var(--mui-palette-secondary-main)",
});

const StyledActions = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export default function ErrorFallback({ isFatal }: { isFatal?: boolean }) {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();

  const handleRefresh = () => router.reload();

  return (
    <StyledRoot>
      <HtmlMeta title={t("error.fallback.title")} />
      <StyledPanel>
        <StyledMark />
        <Typography variant="h1">{t("error.fallback.title")}</Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {isFatal ? t("error.fatal_message") : t("error.fallback.subtitle")}
        </Typography>
        {!isFatal && <ReportButton isResponsive={false} />}
        <StyledActions>
          {!isFatal && (
            <Button variant="outlined" component={Link} href={baseRoute}>
              {t("error.fallback.home_page_link_label")}
            </Button>
          )}
          <Button onClick={handleRefresh}>{t("error.fallback.refresh_page_button_label")}</Button>
        </StyledActions>
      </StyledPanel>
    </StyledRoot>
  );
}
