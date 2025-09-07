import { Container, Typography } from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useListVolunteers } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { volunteerRoute } from "routes";
import { theme } from "theme";

import TeamSection from "./TeamSection";

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
      <TeamSection
        volunteers={volunteers.data?.currentVolunteersList}
        variant={"current"}
      />

      <Container maxWidth="md">
        <Typography
          variant="h2"
          sx={{
            marginTop: theme.spacing(10),
          }}
        >
          {t("team.past_members")}
        </Typography>
      </Container>
      <TeamSection
        volunteers={volunteers.data?.pastVolunteersList}
        variant={"past"}
      />
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
