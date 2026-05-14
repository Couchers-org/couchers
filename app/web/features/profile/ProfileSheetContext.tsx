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
}

const ProfileSheetContext = createContext<ProfileSheetContextType | null>(null);

export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [openProfileUserId, setOpenProfileUserId] = useState<number | null>(
    null,
  );
  const [openGroupChatId, setOpenGroupChatId] = useState<number | null>(null);

  const openProfileSheet = useCallback((userId: number) => {
    setOpenProfileUserId(userId);
    setOpenGroupChatId(null);
  }, []);

  const closeProfileSheet = useCallback(() => {
    setOpenProfileUserId(null);
    setOpenGroupChatId(null);
  }, []);

  const openGroupChat = useCallback((groupChatId: number) => {
    setOpenGroupChatId(groupChatId);
  }, []);

  const closeGroupChat = useCallback(() => {
    setOpenGroupChatId(null);
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
};

export function useProfileSheet() {
  return useContext(ProfileSheetContext) ?? noopProfileSheet;
}
