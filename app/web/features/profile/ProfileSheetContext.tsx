import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface ProfileSheetContextType {
  openProfileSheet: (userId: number) => void;
  closeProfileSheet: () => void;
  openProfileUserId: number | null;
  openGroupChatId: number | null;
  openGroupChat: (groupChatId: number) => void;
  closeGroupChat: () => void;
  selectedBadgeId: string | null;
  openBadge: (badgeId: string) => void;
  closeBadge: () => void;
}

const ProfileSheetContext = createContext<ProfileSheetContextType | null>(null);

export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [openProfileUserId, setOpenProfileUserId] = useState<number | null>(
    null,
  );
  const [openGroupChatId, setOpenGroupChatId] = useState<number | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const openProfileSheet = useCallback((userId: number) => {
    setOpenProfileUserId(userId);
    setOpenGroupChatId(null);
    setSelectedBadgeId(null);
  }, []);

  const closeProfileSheet = useCallback(() => {
    setOpenProfileUserId(null);
    setOpenGroupChatId(null);
    setSelectedBadgeId(null);
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
        openProfileUserId,
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
  openProfileUserId: null,
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
