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
      borderRadius: theme.shape.borderRadius,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "rgba(0, 0, 0, 0.23)",
      boxShadow: theme.shadows[3],
      zIndex: 1,
      backgroundColor: theme.palette.background.default,
      marginTop: theme.spacing(1),
    },
    button: {
      borderRadius: theme.shape.borderRadius,
      boxShadow: `0 0 0 1px rgba(0, 0, 0, 0.23)`,
      padding: "18.5px 14px",
      margin: theme.spacing(1, 0),
      width: "100%",
      fontSize: "16px",
      fontFamily: "inherit",
      justifyContent: "space-between",
      "&:hover": {
        boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
      },
      "&:focus": {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
      },
    },
    tag: {
      padding: "0 14px",
      margin: theme.spacing(1, 0),
      fontSize: theme.typography.fontSize,
      display: "flex",
      alignItems: "center",
    },
    tagLabel: {
      marginLeft: theme.spacing(1),
    },
    header: {
      fontSize: theme.typography.fontSize,
      borderBottomWidth: 1,
      borderBottomStyle: "solid",
      borderBottomColor: theme.palette.divider,
      padding: theme.spacing(1, 2),
    },
    inputBase: {
      padding: theme.spacing(2),
      width: "100%",
      borderBottomWidth: 1,
      borderBottomStyle: "solid",
      borderBottomColor: theme.palette.divider,
      "& input": {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.common.white,
        padding: theme.spacing(1),
        transition: theme.transitions.create(["border-color", "box-shadow"]),
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.palette.divider,
        "&:focus": {
          boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
          borderColor: theme.palette.primary.main,
        },
      },
    },
    paper: {
      boxShadow: "none",
      margin: 0,
    },
    option: {
      minHeight: "auto",
      alignItems: "flex-start",
      padding: theme.spacing(1),
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
  id: string;
}

export default function ProfileTagInput({
  onChange,
  value,
  options,
  label,
  id,
}: ProfileTagInputProps) {
  const classes = useStyles();

  const [open, setOpen] = useState<boolean>(false);
  const anchorEl = useRef<null | HTMLButtonElement>(null);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  const handleClick = () => {
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

  const popperId = open ? id : undefined;

  return (
    <>
      <ButtonBase
        aria-describedby={popperId}
        onClick={handleClick}
        ref={anchorEl}
        classes={{
          root: classes.button,
        }}
      >
        <span>{label}</span>
        <ExpandMore />
      </ButtonBase>
      {value.map((tag) => (
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
        id={popperId}
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
          options={options
            .concat(pendingValue.filter((item) => options.indexOf(item) < 0))
            .sort((a, b) => -b[0].localeCompare(a[0]))}
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
