import {
  Avatar as MuiAvatar,
  Card,
  CardContent,
  Grid,
  Link,
  styled,
  Typography,
} from "@mui/material";
import {
  CouchersIcon,
  EmailIcon,
  GlobeIcon,
  LinkedInIcon,
  PinIcon,
} from "components/Icons";
import IconText from "components/IconText";
import StyledLink from "components/StyledLink";
import { GLOBAL } from "i18n/namespaces";
import { Volunteer } from "proto/public_pb";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { teamRoute } from "routes";
import { theme } from "theme";

const TeamMemberCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "memberType",
})<{ memberType?: "boardMember" | "pastMember" }>(({ memberType }) => ({
  height: `${memberType === "boardMember" ? 15 : 13}rem`,
  border: `1px solid${memberType === "pastMember" ? theme.palette.grey[50] : theme.palette.grey[400]}`,
}));

const TeamMemberCardContent = styled(CardContent)(() => ({
  display: "flex",
}));

const DetailDiv = styled("div")(() => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
}));

const StyledAvatar = styled(MuiAvatar)(() => ({
  width: theme.typography.pxToRem(96),
  height: theme.typography.pxToRem(96),
}));

const StyledSection = styled("section", {
  shouldForwardProp: (prop) => prop !== "boardMembersOnly",
})<{ boardMembersOnly?: boolean }>(({ boardMembersOnly }) => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(6),
  margin: `${boardMembersOnly ? "0" : theme.spacing(4, 0)}`,
}));

const StyledGrid = styled(Grid, {
  shouldForwardProp: (prop) => prop !== "boardMembersOnly",
})<{ boardMembersOnly?: boolean }>(({ boardMembersOnly }) => ({
  justifyContent: "start",
  margin: `${boardMembersOnly ? "0" : theme.spacing(1, 0)}`,
}));

const StyleBoardMemberBadgeText = styled("h3")(() => ({
  padding: theme.spacing(0.4, 0.8),
  borderRadius: "0.2rem",
  alignSelf: "start",
  backgroundColor: theme.palette.primary.main,
}));

const ExtraCard = styled(Card)(({ theme }) => ({
  height: "100%",
  border: `1px solid ${theme.palette.grey[400]}`,
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
  justifyContent: "center",

  [theme.breakpoints.up("md")]: {
    gap: "2rem",
  },
}));

function BoardMemberBadge() {
  const { t } = useTranslation([GLOBAL]);

  return (
    <Typography
      variant="h4"
      component={StyleBoardMemberBadgeText}
      color={theme.palette.common.white}
    >
      {t("team.board_member")}
    </Typography>
  );
}

interface MemberListProps {
  variant: "current" | "past";
  members: Volunteer.AsObject[] | undefined;
  hasExtraCard?: boolean;
  extraCardContent?: { text: string; link: string };
  boardMembersOnly?: boolean;
}

function MemberList({
  variant,
  members,
  hasExtraCard,
  extraCardContent,
  boardMembersOnly,
}: MemberListProps) {
  if (!members?.length) {
    return <></>;
  }

  return (
    <StyledGrid
      container
      maxWidth="xl"
      spacing={2}
      justifyContent="center"
      alignItems="stretch"
      boardMembersOnly={boardMembersOnly}
    >
      {members?.map(
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
            <Fragment key={name}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <TeamMemberCard
                  key={name}
                  memberType={
                    variant === "past"
                      ? "pastMember"
                      : isBoardMember
                        ? "boardMember"
                        : undefined
                  }
                  variant="outlined"
                >
                  <TeamMemberCardContent>
                    <StyledAvatar alt={`Headshot of ${name}`} src={img} />
                    <DetailDiv>
                      <Typography variant={"h3"} component="h2">
                        {name}
                      </Typography>
                      {isBoardMember && <BoardMemberBadge />}
                      <Typography variant="body1">{role}</Typography>
                      <div>
                        <IconText icon={PinIcon} text={location} />
                        {linkUrl && (
                          <IconText
                            icon={
                              linkType === "linkedin"
                                ? LinkedInIcon
                                : linkType === "email"
                                  ? EmailIcon
                                  : linkType === "couchers"
                                    ? CouchersIcon
                                    : GlobeIcon
                            }
                            text={
                              <Typography variant="body1">
                                <StyledLink href={linkUrl}>
                                  {linkText}
                                </StyledLink>
                              </Typography>
                            }
                          />
                        )}
                      </div>
                    </DetailDiv>
                  </TeamMemberCardContent>
                </TeamMemberCard>
              </Grid>
              {hasExtraCard && extraCardContent ? (
                <Grid key="extra" size={{ xs: 12, md: 6, lg: 4 }}>
                  <ExtraCard variant="outlined">
                    <Typography textAlign="center">
                      {extraCardContent.text}
                    </Typography>
                    <Link
                      href={teamRoute}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {extraCardContent.link}
                    </Link>
                  </ExtraCard>
                </Grid>
              ) : null}
            </Fragment>
          );
        },
      )}
    </StyledGrid>
  );
}

interface TeamSectionProps {
  variant: "current" | "past";
  volunteers: Volunteer.AsObject[] | undefined;
  hasExtraCard?: boolean;
  extraCardContent?: { text: string; link: string };
  boardMembersOnly?: boolean;
}
function TeamSection({
  variant,
  volunteers,
  hasExtraCard,
  extraCardContent,
  boardMembersOnly,
}: TeamSectionProps) {
  const volunteersList = useMemo(() => {
    if (!volunteers) {
      return;
    }
    if (variant === "past") {
      return volunteers;
    }

    return volunteers.filter((volunteer) => !volunteer.isBoardMember);
  }, [variant, volunteers]);

  const boardMembers = useMemo(() => {
    if (!volunteers) {
      return false;
    }
    return volunteers.filter((volunteer) => volunteer.isBoardMember);
  }, [volunteers]);

  return (
    <StyledSection boardMembersOnly={boardMembersOnly}>
      {boardMembers ? (
        <MemberList
          members={boardMembers}
          variant={variant}
          hasExtraCard={hasExtraCard}
          extraCardContent={extraCardContent}
          boardMembersOnly={boardMembersOnly}
        />
      ) : null}
      {!boardMembersOnly ? (
        <MemberList members={volunteersList} variant={variant} />
      ) : null}
    </StyledSection>
  );
}

export default TeamSection;
