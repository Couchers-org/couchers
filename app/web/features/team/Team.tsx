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
import { useListVolunteers } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { Volunteer } from "proto/public_pb";
import { volunteerRoute } from "routes";
import { theme } from "theme";

const SpacerDiv = styled("div")(() => ({
  height: theme.spacing(4),
}));

const TeamMemberCard = styled(Card)(() => ({
  height: "100%",
}));

const TeamMemberCardContent = styled(CardContent)(() => ({
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

const StyledSectionTitle = styled("h2")(() => ({
  fontSize: theme.typography.h2.fontSize,
}));

const StyledMembersContainer = styled("div")(() => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(10),
  margin: theme.spacing(4, 0),
}));

interface TeamSectionProps {
  title: string;
  volunteers: Volunteer.AsObject[] | undefined;
}

function TeamSection(props: TeamSectionProps) {
  const { t } = useTranslation([GLOBAL]);

  return (
    <section>
      <StyledSectionTitle>{props.title}</StyledSectionTitle>
      <Grid
        container
        maxWidth="xl"
        spacing={2}
        justifyContent="center"
        alignItems="stretch"
      >
        {props.volunteers?.map(
          ({
            name,
            isBoardMember,
            role,
            location,
            img,
            linkType,
            linkText,
            linkUrl,
          }) => {
            return (
              <Grid key={name} size={{ xs: 12, md: 6, lg: 4 }}>
                <TeamMemberCard elevation={isBoardMember ? 3 : 1}>
                  <TeamMemberCardContent>
                    <StyledAvatar alt={`Headshot of ${name}`} src={img} />
                    <DetailDiv>
                      <Typography
                        variant={isBoardMember ? "h1" : "h2"}
                        component="h2"
                      >
                        {name}
                      </Typography>
                      {isBoardMember && (
                        <Typography variant="h2" component="h3">
                          {t("team.board_member")}
                        </Typography>
                      )}
                      <Typography variant="h3">{role}</Typography>
                      <IconText icon={PinIcon} text={location} />
                      {linkUrl && (
                        <IconText
                          icon={
                            linkType === "linkedin"
                              ? LinkedInIcon
                              : linkType === "email"
                                ? EmailIcon
                                : GlobeIcon
                          }
                          text={
                            <Typography variant="body1">
                              <StyledLink href={linkUrl}>{linkText}</StyledLink>
                            </Typography>
                          }
                        />
                      )}
                    </DetailDiv>
                  </TeamMemberCardContent>
                </TeamMemberCard>
              </Grid>
            );
          },
        )}
      </Grid>
    </section>
  );
}

export default function Team() {
  const { t } = useTranslation([GLOBAL]);
  const volunteers = useListVolunteers();

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
            href={volunteerRoute}
          >
            {t("team.join_the_team")}
          </Button>
        </Typography>
      </Container>
      <SpacerDiv />
      <StyledMembersContainer>
        <TeamSection
          title={t("team.current_members")}
          volunteers={volunteers.data?.currentVolunteersList}
        />
        <TeamSection
          title={t("team.past_members")}
          volunteers={volunteers.data?.pastVolunteersList}
        />
      </StyledMembersContainer>
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
            href={volunteerRoute}
          >
            {t("team.join_our_team")}
          </Button>
        </Typography>
      </Container>
    </>
  );
}
