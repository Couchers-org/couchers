import {
  Card,
  CardContent,
  Container,
  Grid,
  Avatar as MuiAvatar,
  Typography,
  styled,
} from "@mui/material";
import Link from "next/link";

import Button from "@/components/Button";
import HtmlMeta from "@/components/HtmlMeta";
import IconText from "@/components/IconText";
import {
  EmailIcon,
  GlobeIcon,
  LinkedInIcon,
  PinIcon,
} from "@/components/Icons";
import PageTitle from "@/components/PageTitle";
import StyledLink from "@/components/StyledLink";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { VOLUNTEER_ROUTE } from "@/routes";
import { theme } from "@/theme";

import TeamData from "./team.json";

const SpacerDiv = styled("div")(() => ({
  height: theme.spacing(4),
}));

const TeamMemberCard = styled(Card)(() => ({
  height: "100%",
}));

const TeamMembedCardContent = styled(CardContent)(() => ({
  display: "flex",
}));

const DetailDiv = styled("div")(() => ({
  padding: theme.spacing(1, 2),
  flex: "1 1 0%",
}));

const StyledAvatar = styled(MuiAvatar)(() => ({
  width: theme.typography.pxToRem(96),
  height: theme.typography.pxToRem(96),
}));

const Team = () => {
  const { t } = useTranslation([GLOBAL]);

  return (
    <>
      <HtmlMeta title="The Team" />
      <Container maxWidth="md">
        <PageTitle>{t("team.title")}</PageTitle>
        <Typography
          sx={{
            marginBottom: "16px",
          }}
        >
          {t("team.description")}
        </Typography>
        <Typography
          sx={{
            marginBottom: "16px",
          }}
        >
          <Button
            component={Link}
            variant="contained"
            color="secondary"
            href={VOLUNTEER_ROUTE}
          >
            {t("team.join_the_team")}
          </Button>
        </Typography>
      </Container>
      <SpacerDiv />
      <section>
        <Grid
          container
          maxWidth="xl"
          spacing={2}
          justifyContent="center"
          alignItems="stretch"
          sx={{ width: "100%" }}
        >
          {TeamData.map(
            ({
              name,
              director,
              board_position: boardPosition,
              role,
              location,
              img,
              link,
            }) => (
              <Grid key={name} size={{ xs: 12, md: 6, lg: 4 }}>
                <TeamMemberCard elevation={director ? 3 : 1}>
                  <TeamMembedCardContent>
                    <StyledAvatar alt={`Headshot of ${name}`} src={img} />
                    <DetailDiv>
                      <Typography
                        variant={director ? "h1" : "h2"}
                        component="h2"
                      >
                        {name}
                      </Typography>
                      {director && (
                        <Typography variant="h2" component="h3">
                          {boardPosition}
                        </Typography>
                      )}
                      <Typography variant="h3">{role}</Typography>
                      <IconText icon={PinIcon} text={location} />
                      {link && (
                        <IconText
                          icon={
                            link.type === "linkedin"
                              ? LinkedInIcon
                              : link.type === "email"
                                ? EmailIcon
                                : GlobeIcon
                          }
                          text={
                            <Typography variant="body1">
                              <StyledLink href={link.url}>
                                {link.text}
                              </StyledLink>
                            </Typography>
                          }
                        />
                      )}
                    </DetailDiv>
                  </TeamMembedCardContent>
                </TeamMemberCard>
              </Grid>
            ),
          )}
        </Grid>
      </section>
      <SpacerDiv />
      <Container maxWidth="md">
        <Typography variant="h2" component="h2">
          {t("team.have_skills_contribute")}
        </Typography>
        <Typography
          sx={{
            marginBottom: "16px",
          }}
        >
          {t("team.fill_form_description")}
        </Typography>
        <Typography
          sx={{
            marginBottom: "16px",
          }}
        >
          <Button
            component={Link}
            variant="contained"
            color="secondary"
            href={VOLUNTEER_ROUTE}
          >
            {t("team.join_our_team")}
          </Button>
        </Typography>
      </Container>
    </>
  );
};

export default Team;
