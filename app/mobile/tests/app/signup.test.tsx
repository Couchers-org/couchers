import { render } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import SignupScreen from "@/app/signup";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

const mockWebEmbed = jest.fn();
jest.mock("@/components/WebEmbed", () => ({
  __esModule: true,
  default: (props: { path: string }) => {
    mockWebEmbed(props);
    return null;
  },
}));

describe("SignupScreen", () => {
  it("passes the email token and handoff token to the website", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: "a+b=",
      ht: "f00d",
    });

    render(<SignupScreen />);

    expect(mockWebEmbed).toHaveBeenCalledWith({
      path: "/signup?token=a%2Bb%3D&ht=f00d",
    });
  });

  it("loads plain signup without parameters", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<SignupScreen />);

    expect(mockWebEmbed).toHaveBeenCalledWith({ path: "/signup" });
  });
});
