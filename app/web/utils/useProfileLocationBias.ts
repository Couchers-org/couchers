import { useAuthContext } from "features/auth/AuthProvider";
import { useUser } from "features/userQueries/useUsers";
import { useMemo } from "react";
import type { FocusPoint } from "utils/pelias";

/**
 * The logged-in user's profile location, as a soft `focus.point` for forward
 * geocoding — the fallback for when [useLocationBias] has nothing.
 *
 * The coordinates here are the same ones the profile already publishes —
 * deliberately randomized by 2-10km server-side (see `User.geom`) — which is
 * both ample precision for city-level ranking and the reason this adds no new
 * privacy exposure.
 *
 * Returns `undefined` when logged out, while the user is still loading, or when
 * no location has been set (Null Island, matching `EditLocationMap`).
 */
export default function useProfileLocationBias(): FocusPoint | undefined {
  const { authState } = useAuthContext();
  // `undefined` id issues no request, so this is inert when logged out. We
  // deliberately do not use `useCurrentUser`, which redirects to login when
  // there is no user — this hook runs on logged-out surfaces (the homepage
  // search) where that would be very wrong.
  const { data: user } = useUser(authState.userId ?? undefined);
  const lat = user?.lat;
  const lng = user?.lng;

  return useMemo(() => {
    if (lat === undefined || lng === undefined || (lat === 0 && lng === 0)) {
      return undefined;
    }
    return { lat, lon: lng };
  }, [lat, lng]);
}
