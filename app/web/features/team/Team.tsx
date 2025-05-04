import {
  Avatar as MuiAvatar,
  Card,
  CardContent,
  Container,
  Grid,
  styled,
  Typography,
} from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { EmailIcon, GlobeIcon, LinkedInIcon, PinIcon } from "components/Icons";
import IconText from "components/IconText";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { volunteerRoute } from "routes";

import TeamData from "./team.json";

const SpacerDiv = styled("div")(({ theme }) => ({
  height: theme.spacing(4),
}));

const TeamMemberCard = styled(Card)(({ theme }) => ({
  height: "100%",
}));

const TeamMembedCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
}));

const DetailDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  flex: "1 1 0%",
}));

const StyledAvatar = styled(MuiAvatar)(({ theme }) => ({
  width: theme.typography.pxToRem(96),
  height: theme.typography.pxToRem(96),
}));

export default function Team() {
  const { t } = useTranslation([GLOBAL]);

  return (
    <>
      <HtmlMeta title="The Team" />
      <Container maxWidth="md">
        <PageTitle>{t("team.title")}</PageTitle>
        <Typography paragraph>{t("team.description")}</Typography>
        <Typography paragraph>
          <Link href={volunteerRoute} passHref legacyBehavior>
            <Button variant="contained" color="secondary">
              {t("team.join_the_team")}
            </Button>
          </Link>
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
        >
          {TeamData.map(
            ({ name, director, board_position, role, location, img, link }) => (
              <Grid key={name} item xs={12} md={6} lg={4}>
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
                          {board_position}
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
        <Typography paragraph>{t("team.fill_form_description")}</Typography>
        <Typography paragraph>
          <Link href={volunteerRoute} passHref legacyBehavior>
            <Button variant="contained" color="secondary">
              {t("team.join_our_team")}
            </Button>
          </Link>
        </Typography>
      </Container>
    </>
  );
}
