import { useEffect, useState } from "react";

export interface SignupInfo {
  userCount: string;
  // ISO8601 datetime
  lastSignup: string;
  lastLocation: string;
}

export default function useSignupPageInfo() {
  const [signupInfo, setSignupInfo] = useState<SignupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignupInfo = async () => {
      try {
        const response = await fetch(
          "https://couchers.org/api/public/signup-page-info",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch signup info");
        }
        const data = await response.json();
        setSignupInfo(data);
      } catch (error) {
        console.error("Error fetching signup info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignupInfo();
  }, []);

  return { signupInfo, isLoading };
}
