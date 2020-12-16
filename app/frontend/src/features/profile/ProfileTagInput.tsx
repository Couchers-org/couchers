import React, { useState, useEffect, useRef } from "react";
import {
  Checkbox,
  IconButton,
  InputBase,
  ButtonBase,
  Popper,
  fade,
  makeStyles,
  createStyles,
} from "@material-ui/core";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@material-ui/lab/Autocomplete";
import { CloseIcon, ExpandMore } from "../../components/Icons";

const useStyles = makeStyles((theme) =>
  createStyles({
    popper: {
      border: "1px solid rgba(27,31,35,.15)",
      boxShadow: "0 3px 12px rgba(27,31,35,.15)",
      borderRadius: 3,
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
      margin: theme.spacing(1, 0),
      width: "100%",
      fontSize: "16px",
      justifyContent: "space-between",
    },
    tag: {
      padding: "0 14px",
      margin: theme.spacing(1, 0),
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
    },
    tagLabel: {
      marginLeft: theme.spacing(1),
    },
    header: {
      borderBottom: "1px solid #e1e4e8",
      padding: "8px 10px",
      fontWeight: 600,
    },
    inputBase: {
      padding: 10,
      width: "100%",
      borderBottom: "1px solid #dfe2e5",
      "& input": {
        borderRadius: 4,
        backgroundColor: theme.palette.common.white,
        padding: 8,
        transition: theme.transitions.create(["border-color", "box-shadow"]),
        border: "1px solid #ced4da",
        fontSize: 14,
        "&:focus": {
          boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
          borderColor: theme.palette.primary.main,
        },
      },
    },
    paper: {
      boxShadow: "none",
      margin: 0,
      color: "#586069",
    },
    option: {
      minHeight: "auto",
      alignItems: "flex-start",
      padding: 8,
      '&[aria-selected="true"]': {
        backgroundColor: "transparent",
      },
      '&[data-focus="true"]': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    popperDisablePortal: {
      position: "relative",
    },
    checkbox: {
      padding: 0,
      marginRight: theme.spacing(1),
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

  const [open, setOpen] = useState<boolean>(false);
  const anchorEl = useRef<null | HTMLButtonElement>(null);
  const [valueState, setValueState] = useState<string[]>(value);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  useEffect(() => {
    setValueState(value);
  }, [value]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setPendingValue(value);
    setOpen(true);
  };

  const handleClose = (
    event: React.ChangeEvent<{}>,
    reason: AutocompleteCloseReason
  ) => {
    if (reason === "toggleInput") {
      return;
    }
    onChange(null, pendingValue);
    setOpen(false);
  };

  const handleRemove = (tag: string) => {
    onChange(
      null,
      value.filter((v) => v !== tag)
    );
  };

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={handleClick}
        ref={anchorEl}
        classes={{
          root: classes.button,
        }}
      >
        <span>{label}</span>
        <ExpandMore />
      </ButtonBase>
      {valueState.map((tag) => (
        <div key={tag} className={classes.tag}>
          <IconButton
            aria-label={`Remove ${tag}`}
            edge="start"
            onClick={() => handleRemove(tag)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <span className={classes.tagLabel}>{tag}</span>
        </div>
      ))}
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl.current}
        placement="bottom-start"
        className={classes.popper}
      >
        <div className={classes.header}>Press 'Enter' to add</div>
        <Autocomplete
          open
          onClose={handleClose}
          freeSolo
          multiple
          classes={{
            paper: classes.paper,
            option: classes.option,
            popperDisablePortal: classes.popperDisablePortal,
          }}
          onChange={(_, newValue) => {
            setPendingValue(newValue);
          }}
          value={pendingValue}
          renderInput={(params) => (
            <InputBase
              ref={params.InputProps.ref}
              inputProps={params.inputProps}
              autoFocus
              className={classes.inputBase}
            />
          )}
          disableCloseOnSelect
          disablePortal
          renderTags={() => null}
          noOptionsText="No Languages"
          options={options.concat(value)}
          renderOption={(option, { selected }) => (
            <>
              <Checkbox
                color="primary"
                size="small"
                classes={{ root: classes.checkbox }}
                checked={selected}
              />
              {option}
            </>
          )}
        />
      </Popper>
    </>
  );
}
