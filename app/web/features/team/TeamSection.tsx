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
import { GLOBAL } from "i18n/namespaces";
import { Volunteer } from "proto/public_pb";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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

const StyledSection = styled("section")(() => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(6),
  margin: theme.spacing(4, 0),
}));

const StyledGrid = styled(Grid)(() => ({
  justifyContent: "start",
  margin: theme.spacing(1, 0),
}));

const StyleBoardMemberBadgeText = styled("h3")(() => ({
  padding: theme.spacing(0.4, 0.8),
  borderRadius: "0.2rem",
  alignSelf: "start",
  backgroundColor: theme.palette.primary.main,
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
  volunteers: Volunteer.AsObject[] | undefined;
}

function MemberList({ variant, volunteers }: MemberListProps) {
  if (!volunteers?.length) {
    return <></>;
  }

  return (
    <StyledGrid
      container
      spacing={2}
      sx={{
        maxWidth: "xl",
        justifyContent: "center",
        alignItems: "stretch",
      }}
    >
      {volunteers?.map(
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
    </StyledGrid>
  );
}

interface TeamSectionProps {
  variant: "current" | "past";
  volunteers: Volunteer.AsObject[] | undefined;
}
function TeamSection({ variant, volunteers }: TeamSectionProps) {
  const sections = useMemo(() => {
    if (variant === "past") {
      return [volunteers];
    }

    return (volunteers ?? []).reduce<Volunteer.AsObject[][]>(
      (acc, curr) => {
        if (variant)
          if (curr.isBoardMember) {
            acc[0].push(curr);
          } else {
            acc[1].push(curr);
          }

        return acc;
      },
      [[], []],
    );
  }, [variant, volunteers]);

  return (
    <StyledSection>
      {sections.map((section, index) => (
        <MemberList key={index} volunteers={section} variant={variant} />
      ))}
    </StyledSection>
  );
}

export default TeamSection;
