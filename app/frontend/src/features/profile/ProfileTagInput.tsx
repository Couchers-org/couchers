import React, { useState, useEffect } from "react";
import {
  InputBase,
  ButtonBase,
  Popper,
  makeStyles,
  createStyles,
} from "@material-ui/core";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@material-ui/lab/Autocomplete";
import { DoneIcon, CloseIcon, ExpandMore } from "../../components/Icons";

const useStyles = makeStyles((theme) =>
  createStyles({
    popper: {
      border: "1px solid rgba(27,31,35,.15)",
      boxShadow: "0 3px 12px rgba(27,31,35,.15)",
      borderRadius: 3,
      width: "100%",
      zIndex: 1,
      color: "#586069",
      backgroundColor: "#f6f8fa",
    },
    button: {
      borderRadius: theme.shape.borderRadius,
      borderColor: "rgba(0, 0, 0, 0.23)",
      borderWidth: 1,
      borderStyle: "solid",
      padding: "18.5px 14px",
      width: "100%",
      fontSize: "16px",
      justifyContent: "space-between",
    },
    tag: {
      padding: "0 14px",
      margin: "18.5px 0",
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
    },
    tagLabel: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface ProfileTagInputProps {
  onChange: (_: any, value: string[]) => void;
  value: string[];
  options: string[];
  label: string;
}

export default function ProfileTagInput({
  onChange,
  value,
  options,
  label,
}: ProfileTagInputProps) {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [valueState, setValueState] = useState<string[]>(value);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  useEffect(() => {
    setValueState(value);
  }, [value]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setPendingValue(value);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (
    event: React.ChangeEvent<{}>,
    reason: AutocompleteCloseReason
  ) => {
    if (reason === "toggleInput") {
      return;
    }
    onChange(null, pendingValue);
    if (anchorEl) {
      anchorEl.focus();
    }
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "github-label" : undefined;

  return (
    <>
      <ButtonBase
        disableRipple
        aria-describedby={id}
        onClick={handleClick}
        classes={{
          root: classes.button,
        }}
      >
        <span>{label}</span>
        <ExpandMore />
      </ButtonBase>
      {valueState.map((tag) => (
        <div key={tag} className={classes.tag}>
          <CloseIcon fontSize="small" />
          <span className={classes.tagLabel}>{tag}</span>
        </div>
      ))}
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        className={classes.popper}
      >
        <Autocomplete
          disableClearable={false}
          open
          freeSolo
          multiple
          onClose={handleClose}
          onChange={onChange}
          value={value}
          options={value.concat(options)}
          renderInput={(params) => <InputBase {...params} autoFocus />}
          disableCloseOnSelect
          disablePortal
          noOptionsText="No Languages"
          renderOption={(option, { selected }) => (
            <>
              <DoneIcon
                style={{ visibility: selected ? "visible" : "hidden" }}
              />
              <div>{option}</div>
              <CloseIcon
                style={{ visibility: selected ? "visible" : "hidden" }}
              />
            </>
          )}
        />
      </Popper>
    </>
  );
}
