import { Snackbar } from "@material-ui/core";
import { CloseIcon, NotificationNewIcon } from "components/Icons";
import { useTranslation } from "i18n";
import React, { createContext, ReactNode, useContext, useState } from "react";
import makeStyles from "utils/makeStyles";

type AlertSeverity = "info" | "success" | "warning" | "error";

export enum AlertSeverityEnum {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

// Define the shape of the notification state
interface NotificationState {
  open: boolean;
  message: string;
  severity?: AlertSeverity;
}

// Define the NotificationContext value
interface NotificationContextType {
  showNotification: (message: string, severity?: AlertSeverityEnum) => void;
}

// Create the NotificationContext with an initial value of undefined
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Custom hook to use the NotificationContext
export const useSendNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useSendNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Define the props for the NotificationProvider component
interface NotificationProviderProps {
  children: ReactNode;
}

const useStyles = makeStyles((theme) => ({
  icon: {
    marginRight: theme.spacing(2),
  },
  message: {
    display: "flex",
    alignItems: "center",
    fontSize: ".75rem",
    height: "100%",
    width: "100%",
  },
  root: {
    "&.MuiSnackbar-root": {
      transform: "unset",
      width: "380px",
      height: "80px",
    },
    "& .MuiSnackbarContent-root": {
      flexGrow: "1",
      flexWrap: "nowrap",
      backgroundColor: "white",
      color: theme.palette.text.primary,
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadius,
      width: "100%",
      height: "100%",
    },
  },
}));

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: AlertSeverityEnum.INFO,
  });

  const showNotification = (
    message: string,
    severity: AlertSeverityEnum = AlertSeverityEnum.INFO
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleClose = () => {
    setNotification((prevState) => ({
      ...prevState,
      open: false,
    }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        className={classes.root}
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        message={
          <div className={classes.message}>
            <NotificationNewIcon className={classes.icon} />
            {notification.message}
          </div>
        }
        action={
          <CloseIcon
            aria-label={t("close")}
            color="action"
            onClick={handleClose}
            fontSize="small"
          />
        }
      ></Snackbar>
    </NotificationContext.Provider>
  );
};
