import {
  Avatar as MuiAvatar,
  Card,
  CardContent,
  Grid,
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
import { Volunteer } from "couchers/proto/public_pb";
import { GLOBAL } from "i18n/namespaces";
import { useMemo } from "react";
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
  margin: boardMembersOnly ? "0" : theme.spacing(4, 0),
}));

const StyledGrid = styled(Grid, {
  shouldForwardProp: (prop) => prop !== "boardMembersOnly",
})<{ boardMembersOnly?: boolean }>(({ boardMembersOnly }) => ({
  justifyContent: "start",
  margin: boardMembersOnly ? "0" : theme.spacing(1, 0),
}));

const StyleBoardMemberBadgeText = styled("h3")(() => ({
  padding: theme.spacing(0.4, 0.8),
  borderRadius: "0.2rem",
  alignSelf: "start",
  backgroundColor: theme.palette.primary.main,
}));

const ExtraCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderColor: "var(--mui-palette-grey-400)",
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
      sx={{ color: theme.palette.common.white }}
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
      spacing={2}
      boardMembersOnly={boardMembersOnly}
      sx={{
        maxWidth: "xl",
        justifyContent: "center",
        alignItems: "stretch",
      }}
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
            <Grid key={name} size={{ xs: 12, md: 6, lg: 4 }}>
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
                              <StyledLink href={linkUrl}>{linkText}</StyledLink>
                            </Typography>
                          }
                        />
                      )}
                    </div>
                  </DetailDiv>
                </TeamMemberCardContent>
              </TeamMemberCard>
            </Grid>
          );
        },
      )}
      {hasExtraCard && extraCardContent ? (
        <Grid key="extra" size={{ xs: 12, md: 6, lg: 4 }}>
          <ExtraCard variant="outlined">
            <Typography
              sx={{
                textAlign: "center",
              }}
            >
              {extraCardContent.text}
            </Typography>
            <StyledLink href={teamRoute}>{extraCardContent.link}</StyledLink>
          </ExtraCard>
        </Grid>
      ) : null}
    </StyledGrid>
  );
}

type ExtraCardContent = {
  text: string;
  link: string;
};

interface TeamSectionProps {
  variant: "current" | "past";
  volunteers: Volunteer.AsObject[] | undefined;
  hasExtraCard?: boolean;
  extraCardContent?: ExtraCardContent;
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
      return;
    }
    return volunteers.filter((volunteer) => volunteer.isBoardMember);
  }, [volunteers]);

  return (
    <StyledSection boardMembersOnly={boardMembersOnly}>
      {variant === "past" ? (
        <MemberList members={volunteersList} variant={variant} />
      ) : (
        <>
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
        </>
      )}
    </StyledSection>
  );
}

export default TeamSection;
