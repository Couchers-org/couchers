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
}

const ProfileSheetContext = createContext<ProfileSheetContextType | null>(null);

export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [openProfileUserId, setOpenProfileUserId] = useState<number | null>(
    null,
  );

  const openProfileSheet = useCallback((userId: number) => {
    setOpenProfileUserId(userId);
  }, []);

  const closeProfileSheet = useCallback(() => {
    setOpenProfileUserId(null);
  }, []);

  return (
    <ProfileSheetContext.Provider
      value={{ openProfileSheet, closeProfileSheet, openProfileUserId }}
    >
      {children}
    </ProfileSheetContext.Provider>
  );
}

const noopProfileSheet: ProfileSheetContextType = {
  openProfileSheet: () => {},
  closeProfileSheet: () => {},
  openProfileUserId: null,
};

export function useProfileSheet() {
  return useContext(ProfileSheetContext) ?? noopProfileSheet;
}
