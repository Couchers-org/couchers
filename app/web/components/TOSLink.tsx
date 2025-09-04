import { styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";

import { tosRoute } from "@/routes";

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "underline",
}));

export default function TOSLink() {
  const { t } = useTranslation("global");
  return (
    <StyledLink href={tosRoute} target="_blank">
      {t("terms_of_service")}
    </StyledLink>
  );
}
