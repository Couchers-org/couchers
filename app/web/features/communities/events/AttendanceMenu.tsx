import { ListItemText, styled } from "@mui/material";
import Button from "components/Button";
import { CheckCircleIcon, CheckIcon, ExpandLessIcon, ExpandMoreIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { AttendanceState } from "proto/events_pb";
import { useState } from "react";
import { theme } from "theme";

const StyledMenuListItem = styled(MenuItem)(() => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export default function AttendanceMenu({
  loading,
  onChangeAttendanceState,
  attendanceState,
  id,
  disabled = false,
}: {
  loading: boolean;
  onChangeAttendanceState: (attendanceState: AttendanceState) => void;
  attendanceState: AttendanceState;
  id: string;
  disabled: boolean;
}) {
  const { t } = useTranslation([COMMUNITIES]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isAttending = attendanceState === AttendanceState.ATTENDANCE_STATE_GOING;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAttending) {
      onChangeAttendanceState(AttendanceState.ATTENDANCE_STATE_GOING);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleChangeAttendanceState = (attendanceState: AttendanceState) => {
    onChangeAttendanceState(attendanceState);
    setAnchorEl(null);
  };

  /* @todo: this id can be unique and not passed from outside when we have React 18 useId */
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;

  return (
    <>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        loading={loading}
        variant={isAttending ? "outlined" : "contained"}
        color="primary"
        disabled={disabled}
        startIcon={isAttending ? <CheckCircleIcon sx={{ color: theme.palette.primary.main }} /> : undefined}
        endIcon={isAttending ? open ? <ExpandLessIcon /> : <ExpandMoreIcon /> : undefined}
      >
        {isAttending ? t("communities:going_to_event") : t("communities:join_event")}
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        aria-hidden={!open}
        slotProps={{
          list: {
            "aria-labelledby": buttonId,
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <StyledMenuListItem
          onClick={() => {
            handleChangeAttendanceState(AttendanceState.ATTENDANCE_STATE_GOING);
          }}
        >
          <ListItemText primary={t("communities:going_to_event")} />
          {attendanceState === AttendanceState.ATTENDANCE_STATE_GOING && <CheckIcon />}
        </StyledMenuListItem>
        <StyledMenuListItem
          onClick={() => {
            handleChangeAttendanceState(AttendanceState.ATTENDANCE_STATE_NOT_GOING);
          }}
        >
          <ListItemText primary={t("communities:not_going_to_event")} />
          {attendanceState === AttendanceState.ATTENDANCE_STATE_NOT_GOING && <CheckIcon />}
        </StyledMenuListItem>
      </Menu>
    </>
  );
}
