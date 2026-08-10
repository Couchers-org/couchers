import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ProfileSheetContextType {
  openProfileSheet: (userId: number) => void;
  closeProfileSheet: () => void;
  goBackProfile: () => void;
  openProfileUserId: number | null;
  profileHistory: number[];
  openGroupChatId: number | null;
  openGroupChat: (groupChatId: number) => void;
  closeGroupChat: () => void;
  selectedBadgeId: string | null;
  openBadge: (badgeId: string) => void;
  closeBadge: () => void;
}

const ProfileSheetContext = createContext<ProfileSheetContextType | null>(null);

export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [openProfileUserId, setOpenProfileUserId] = useState<number | null>(null);
  const [profileHistory, setProfileHistory] = useState<number[]>([]);
  const [openGroupChatId, setOpenGroupChatId] = useState<number | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  // Ref so openProfileSheet can read the current userId without being recreated on every change
  const openProfileUserIdRef = useRef(openProfileUserId);
  useEffect(() => {
    openProfileUserIdRef.current = openProfileUserId;
  }, [openProfileUserId]);

  const openProfileSheet = useCallback((userId: number) => {
    const currentId = openProfileUserIdRef.current;
    setProfileHistory(currentId !== null ? (h) => [...h, currentId] : []);
    setOpenProfileUserId(userId);
    setOpenGroupChatId(null);
    setSelectedBadgeId(null);
  }, []);

  const goBackProfile = useCallback(() => {
    setProfileHistory((prev) => {
      const next = [...prev];
      const previousId = next.pop();
      if (previousId !== undefined) {
        setOpenProfileUserId(previousId);
      }
      return next;
    });
  }, []);

  const closeProfileSheet = useCallback(() => {
    setOpenProfileUserId(null);
    setOpenGroupChatId(null);
    setSelectedBadgeId(null);
    setProfileHistory([]);
  }, []);

  const openGroupChat = useCallback((groupChatId: number) => {
    setOpenGroupChatId(groupChatId);
  }, []);

  const closeGroupChat = useCallback(() => {
    setOpenGroupChatId(null);
  }, []);

  const openBadge = useCallback((badgeId: string) => {
    setSelectedBadgeId(badgeId);
  }, []);

  const closeBadge = useCallback(() => {
    setSelectedBadgeId(null);
  }, []);

  return (
    <ProfileSheetContext.Provider
      value={{
        openProfileSheet,
        closeProfileSheet,
        goBackProfile,
        openProfileUserId,
        profileHistory,
        openGroupChatId,
        openGroupChat,
        closeGroupChat,
        selectedBadgeId,
        openBadge,
        closeBadge,
      }}
    >
      {children}
    </ProfileSheetContext.Provider>
  );
}

const noopProfileSheet: ProfileSheetContextType = {
  openProfileSheet: () => {},
  closeProfileSheet: () => {},
  goBackProfile: () => {},
  openProfileUserId: null,
  profileHistory: [],
  openGroupChatId: null,
  openGroupChat: () => {},
  closeGroupChat: () => {},
  selectedBadgeId: null,
  openBadge: () => {},
  closeBadge: () => {},
};

export function useProfileSheet() {
  return useContext(ProfileSheetContext) ?? noopProfileSheet;
}
