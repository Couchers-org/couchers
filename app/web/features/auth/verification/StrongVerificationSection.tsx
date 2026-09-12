import {
  CheckCircle,
  DeleteOutlineOutlined,
  EnhancedEncryptionOutlined,
  ForumOutlined,
  PhoneIphoneOutlined,
  PhotoLibraryOutlined,
  SearchOutlined,
  VerifiedUser,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import { alpha, Box, styled, Typography } from "@mui/material";
import Button from "components/Button";
import { GALLERY_MAX_PHOTOS_NOT_VERIFIED, GALLERY_MAX_PHOTOS_VERIFIED } from "features/auth/verification/constants";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Link from "next/link";
import { ReactNode } from "react";
import { strongVerificationRoute } from "routes";

import DeleteStrongVerificationDataButton from "./DeleteStrongVerificationDataButton";
import { ActionRow, SectionBlock, SectionRoot, SuccessBanner, VerificationSectionHeader } from "./VerificationSection";

type StrongVerificationSectionProps = {
  hasStrongVerification: boolean;
};

/** Auto-fitting grid of small cards; used for both benefits and data notes. */
const CardGrid = styled("div", {
  shouldForwardProp: (prop) => prop !== "minColumnWidth",
})<{ minColumnWidth: number }>(({ theme, minColumnWidth }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
  gap: theme.spacing(1.25),
}));

const BenefitCard = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.5),
  borderRadius: "8px",
  backgroundColor: "var(--mui-palette-background-paper)",
  border: "1px solid var(--mui-palette-divider)",
  "& .MuiSvgIcon-root": { fontSize: 20, color: "var(--mui-palette-primary-main)" },
}));

const DataNote = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.25),
  alignItems: "flex-start",
  padding: theme.spacing(1.75),
  borderRadius: "8px",
  backgroundColor: "var(--mui-palette-grey-50)",
  "& .MuiSvgIcon-root": { fontSize: 20, color: "var(--mui-palette-primary-main)" },
}));

function Benefit({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <BenefitCard>
      {icon}
      <Typography variant="h4" component="div">
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
        {description}
      </Typography>
    </BenefitCard>
  );
}

export default function StrongVerificationSection({ hasStrongVerification }: StrongVerificationSectionProps) {
  const { t } = useTranslation(AUTH);

  return (
    <SectionRoot id="strong-verification">
      <VerificationSectionHeader
        icon={<VerifiedUser />}
        iconTint="primary"
        title={t("strong_verification.title")}
        description={t("verification_page.strong.description")}
        status={hasStrongVerification ? "verified" : "not_verified"}
      />

      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          padding: theme.spacing(2.25),
          borderRadius: "10px",
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        })}
      >
        <Typography variant="h3">{t("verification_page.strong.benefits_header")}</Typography>
        <CardGrid minColumnWidth={128}>
          <Benefit
            icon={<PhotoLibraryOutlined />}
            title={t("verification_page.strong.benefits.photos_title", { count: GALLERY_MAX_PHOTOS_VERIFIED })}
            description={t("verification_page.strong.benefits.photos_description", {
              unverified_count: GALLERY_MAX_PHOTOS_NOT_VERIFIED,
            })}
          />
          <Benefit
            icon={<SearchOutlined />}
            title={t("verification_page.strong.benefits.visibility_title")}
            description={t("verification_page.strong.benefits.visibility_description")}
          />
          <Benefit
            icon={<WorkspacePremiumOutlined />}
            title={t("verification_page.strong.benefits.badge_title")}
            description={t("verification_page.strong.benefits.badge_description")}
          />
          <Benefit
            icon={<ForumOutlined />}
            title={t("verification_page.strong.benefits.interactions_title")}
            description={t("verification_page.strong.benefits.interactions_description")}
          />
        </CardGrid>
      </Box>

      <CardGrid minColumnWidth={240}>
        <DataNote>
          <PhoneIphoneOutlined />
          <Typography variant="body2">
            <Trans t={t} i18nKey="verification_page.strong.data_notes.third_party" />
          </Typography>
        </DataNote>
        <DataNote>
          <EnhancedEncryptionOutlined />
          <Typography variant="body2">
            <Trans t={t} i18nKey="verification_page.strong.data_notes.encryption" />
          </Typography>
        </DataNote>
        <DataNote>
          <DeleteOutlineOutlined />
          <Typography variant="body2">
            <Trans t={t} i18nKey="verification_page.strong.data_notes.deletion" />
          </Typography>
        </DataNote>
      </CardGrid>

      {hasStrongVerification ? (
        <SectionBlock>
          <SuccessBanner>
            <CheckCircle />
            <Typography variant="body1">{t("verification_page.strong.verified_message")}</Typography>
          </SuccessBanner>
          <ActionRow align="center">
            <DeleteStrongVerificationDataButton variant="outlined" />
          </ActionRow>
        </SectionBlock>
      ) : (
        <SectionBlock>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography variant="h3">{t("verification_page.strong.requirements_header")}</Typography>
            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingInlineStart: 2.5,
                color: "var(--mui-palette-text-secondary)",
              }}
            >
              <Typography variant="body1" component="li">
                {t("verification_page.strong.requirements.passport")}
              </Typography>
              <Typography variant="body1" component="li">
                {t("verification_page.strong.requirements.nfc_phone")}
              </Typography>
              <Typography variant="body1" component="li">
                {t("verification_page.strong.requirements.time")}
              </Typography>
            </Box>
          </Box>
          <ActionRow align="center">
            <Button component={Link} href={strongVerificationRoute} size="large">
              {t("strong_verification.start_button")}
            </Button>
            <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
              {t("verification_page.strong.start_hint")}
            </Typography>
          </ActionRow>
        </SectionBlock>
      )}
    </SectionRoot>
  );
}
