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
import { DoneIcon, CloseIcon } from "../../components/Icons";

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
      borderColor: theme.palette.text.primary,
      borderWidth: 1,
      padding: "18.5px 14px",
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
        className={classes.button}
      >
        <span>{label}</span>
      </ButtonBase>
      {valueState.map((tag) => (
        <div key={tag}>{tag}</div>
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
