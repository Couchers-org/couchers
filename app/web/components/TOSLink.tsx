import { styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";

import { TOS_ROUTE } from "@/routes";

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "underline",
}));

const TOSLink = () => {
  const { t } = useTranslation("global");
  return (
    <StyledLink href={TOS_ROUTE} target="_blank">
      {t("terms_of_service")}
    </StyledLink>
  );
};

export default TOSLink;
