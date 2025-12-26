import { ButtonProps, styled } from "@mui/material";
import Button from "components/Button";

const StyledButton = styled(Button)<ButtonProps>(() => ({
  flexShrink: 0,
}));

const FieldButton = ({
  children,
  callback,
  disabled,
  isLoading,
  isSubmit,
  variant = "contained",
}: {
  children: string;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
  isSubmit?: boolean;
  variant?: "text" | "outlined" | "contained";
}) => {
  return (
    <StyledButton
      color="primary"
      disabled={disabled}
      loading={isLoading}
      onClick={callback}
      type={isSubmit ? "submit" : "button"}
      variant={variant}
    >
      {children}
    </StyledButton>
  );
};

export default FieldButton;
