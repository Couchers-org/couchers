import { ListItemText } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Button from "components/Button";
import { CheckIcon, ExpandLessIcon, ExpandMoreIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { AttendanceState } from "proto/events_pb";
import { useState } from "react";

const useStyles = makeStyles((theme) => ({
  menuListItem: {
    display: "flex",
    gap: theme.spacing(2),
  },
}));

export default function AttendanceMenu({
  loading,
  onChangeAttendanceState,
  attendanceState,
  id,
}: {
  loading: boolean;
  onChangeAttendanceState: (attendanceState: AttendanceState) => void;
  attendanceState: AttendanceState;
  id: string;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useStyles();

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
        MenuListProps={{
          "aria-labelledby": buttonId,
        }}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            handleChangeAttendanceState(AttendanceState.ATTENDANCE_STATE_GOING);
          }}
          classes={{ root: classes.menuListItem }}
        >
          <ListItemText primary={t("communities:going_to_event")} />
          {attendanceState === AttendanceState.ATTENDANCE_STATE_GOING && (
            <CheckIcon />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleChangeAttendanceState(
              AttendanceState.ATTENDANCE_STATE_NOT_GOING
            );
          }}
          classes={{ root: classes.menuListItem }}
        >
          <ListItemText primary={t("communities:not_going_to_event")} />
          {attendanceState === AttendanceState.ATTENDANCE_STATE_NOT_GOING && (
            <CheckIcon />
          )}
        </MenuItem>
      </Menu>
    </>
  );
}
