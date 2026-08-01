import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Updates from "expo-updates";
import { Linking } from "react-native";

import NativeUpdatePrompt from "@/features/diagnostics/NativeUpdatePrompt";
import { UpdatePrompt } from "@/features/diagnostics/updateDecision";
import {
  NativeUpdateAction,
  NativeUpdateCause,
  NativeUpdateInfo,
} from "couchers/proto/bugs_pb";

jest.mock("expo-updates", () => ({
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

function info(
  overrides: Partial<NativeUpdateInfo.AsObject> = {},
): NativeUpdateInfo.AsObject {
  return {
    action: NativeUpdateAction.NATIVE_UPDATE_ACTION_STORE,
    required: false,
    message: "A new version is available.",
    linkUrl: "https://apps.apple.com/app/id123",
    linkText: "Update now",
    cause: NativeUpdateCause.NATIVE_UPDATE_CAUSE_AGE,
    ...overrides,
  };
}

function prompt(
  mode: UpdatePrompt["mode"],
  overrides: Partial<NativeUpdateInfo.AsObject> = {},
): UpdatePrompt {
  return { info: info(overrides), mode };
}

describe("NativeUpdatePrompt", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("renders nothing when there is no prompt", () => {
    const { toJSON } = render(
      <NativeUpdatePrompt prompt={null} onDismiss={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("shows the backend message and link text", () => {
    render(<NativeUpdatePrompt prompt={prompt("nag")} onDismiss={jest.fn()} />);
    expect(screen.getByText("A new version is available.")).toBeOnTheScreen();
    expect(screen.getByText("Update now")).toBeOnTheScreen();
  });

  it("dismissible modes show a Later button that dismisses", () => {
    const onDismiss = jest.fn();
    render(<NativeUpdatePrompt prompt={prompt("nag")} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText("update.later"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("block mode has no Later button", () => {
    render(
      <NativeUpdatePrompt
        prompt={prompt("block", { required: true })}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.queryByText("update.later")).toBeNull();
  });

  it("opens the link for store updates", () => {
    render(<NativeUpdatePrompt prompt={prompt("nag")} onDismiss={jest.fn()} />);
    fireEvent.press(screen.getByText("Update now"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://apps.apple.com/app/id123",
    );
    expect(Updates.fetchUpdateAsync).not.toHaveBeenCalled();
  });

  it("applies OTA updates in-app instead of opening a link", () => {
    (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValue({});
    render(
      <NativeUpdatePrompt
        prompt={prompt("nag", {
          action: NativeUpdateAction.NATIVE_UPDATE_ACTION_OTA,
        })}
        onDismiss={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText("Update now"));
    expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("falls back to a default button label per action", () => {
    render(
      <NativeUpdatePrompt
        prompt={prompt("nag", {
          action: NativeUpdateAction.NATIVE_UPDATE_ACTION_REINSTALL,
          linkText: "",
        })}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByText("update.action_reinstall")).toBeOnTheScreen();
  });
});
