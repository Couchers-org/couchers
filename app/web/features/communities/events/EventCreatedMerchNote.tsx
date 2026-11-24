import { StorefrontOutlined } from "@mui/icons-material";
import { Alert, Button, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { shopRoute } from "routes";

const StyledCard = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: "var(--mui-palette-background-paper)",
  overflow: "hidden",
}));

const StyledBody = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

const StyledMessage = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  flex: 1,
}));

/**
 * Shown once, right after the organizer creates an event (the create page redirects here with
 * ?created=true). The flag is removed from the URL straight away, so a refresh or shared link
 * doesn't show it again.
 */
export default function EventCreatedMerchNote() {
  const { t } = useTranslation(COMMUNITIES);
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!router.isReady || router.query.created !== "true") return;
    setShow(true);
    const query = { ...router.query };
    delete query.created;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router]);

  if (!show) return null;

  return (
    <StyledCard>
      <Alert severity="success" sx={{ borderRadius: 0 }}>
        {t("communities:event_created_merch_note.title")}
      </Alert>
      <StyledBody>
        <StyledMessage>
          <StorefrontOutlined color="secondary" />
          <Typography variant="body1">{t("communities:event_created_merch_note.message")}</Typography>
        </StyledMessage>
        <Button
          component={Link}
          href={`${shopRoute}?utm_source=event_created`}
          variant="outlined"
          color="secondary"
          sx={{ flexShrink: 0 }}
        >
          {t("communities:event_created_merch_note.shop_button")}
        </Button>
      </StyledBody>
    </StyledCard>
  );
}
