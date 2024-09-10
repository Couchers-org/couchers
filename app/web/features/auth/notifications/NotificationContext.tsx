import { Snackbar } from "@material-ui/core";
import Alert from "components/Alert";
import React, { createContext, ReactNode, useContext, useState } from "react";

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

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
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
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
