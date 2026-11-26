import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import MapAnimation from "components/MapAnimation";
import CouchersIntroduction from "features/landing/CouchersIntroduction";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { signupRoute } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../auth/AuthProvider";

const StyledContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(4, 0),

  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export default function HeroSection() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const { authState, authActions } = useAuthContext();
  const urlToken = stringOrFirstString(router.query.token);

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  useEffect(() => {
    if (authState.error) window.scroll({ top: 0, behavior: "smooth" });
  }, [authState.error]);

  useEffect(() => {
    if (urlToken) router.replace({ pathname: signupRoute, query: { token: urlToken } });
    // next-router-mock router isn't memoized, so putting router in the dependencies
    // causes infinite looping in tests
  }, [urlToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <HtmlMeta title={t("global:join_us")} />
      <StyledContent>
        <CouchersIntroduction />
        <MapAnimation />
      </StyledContent>
    </>
  );
}
