import { styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { DASHBOARD } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { routeToEditProfile } from "routes";

const StyledLinksContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  rowGap: theme.spacing(2),
  columnGap: theme.spacing(4),
  justifyContent: "center",
  marginBottom: theme.spacing(3),
}));

const makeStyledTab = <C extends React.ComponentType<React.ComponentProps<C>>>(
  component: C,
) => {
  return styled(component, {
    shouldForwardProp: (prop) => prop !== "isSelected",
  })<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
    position: "relative",
    paddingBottom: theme.spacing(1),
    color: "var(--mui-palette-text-primary)",
    fontWeight: 600,
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: 40,
      height: 2,
      background: "var(--mui-palette-primary-main)",
      transition: `opacity ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
      opacity: isSelected ? 1 : 0,
    },
    "&:hover::after": {
      opacity: 1,
    },
  }));
};

const StyledDefaultTab = makeStyledTab(Typography);
const StyledLinkTab = makeStyledTab(StyledLink);

export default function HeroLinks() {
  const { t } = useTranslation(DASHBOARD);

  return (
    <>
      <StyledLinksContainer>
        <StyledDefaultTab color="textPrimary" variant="body1" isSelected={true}>
          {t("find_a_host")}
        </StyledDefaultTab>

        <StyledLinkTab underline="none" href={routeToEditProfile("home")}>
          {t("become_a_host")}
        </StyledLinkTab>

        <StyledLinkTab underline="none" href="/communities">
          {t("browse_communities")}
        </StyledLinkTab>
      </StyledLinksContainer>
    </>
  );
}
