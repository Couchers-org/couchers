import { ListItemText, styled } from "@mui/material";
import Button from "components/Button";
import { CheckIcon, ExpandLessIcon, ExpandMoreIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { AttendanceState } from "proto/events_pb";
import { useState } from "react";

const StyledMenuListItem = styled(MenuItem)(({ theme }) => ({
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
  const isAttending =
    attendanceState === AttendanceState.ATTENDANCE_STATE_GOING;

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
        disabled={disabled}
        sx={{
          color: isAttending ? "common.black" : "common.white",
          borderColor: "grey.300",
        }}
      >
        {isAttending
          ? t("communities:going_to_event")
          : t("communities:join_event")}

        {isAttending && (open ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        aria-hidden={!open}
        MenuListProps={{
          "aria-labelledby": buttonId,
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
          {attendanceState === AttendanceState.ATTENDANCE_STATE_GOING && (
            <CheckIcon />
          )}
        </StyledMenuListItem>
        <StyledMenuListItem
          onClick={() => {
            handleChangeAttendanceState(
              AttendanceState.ATTENDANCE_STATE_NOT_GOING,
            );
          }}
        >
          <ListItemText primary={t("communities:not_going_to_event")} />
          {attendanceState === AttendanceState.ATTENDANCE_STATE_NOT_GOING && (
            <CheckIcon />
          )}
        </StyledMenuListItem>
      </Menu>
    </>
  );
}
