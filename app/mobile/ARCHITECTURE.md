# Mobile App Architecture Overview

## TL;DR

The Couchers mobile app is a **React Native shell that wraps the Next.js web app in WebViews**. This lets us reuse 95%+ of our codebase while providing native features like push notifications and tab navigation. The main complexity is keeping the mobile tab navigation in sync with the web app's internal navigation.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ React Native App (Expo)                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Bottom Tab Navigator (Expo Router)             │  │
│  │                                                │  │
│  │ [Dashboard] [Search] [Messages] [Communities]  │  │
│  └────────────────────────────────────────────────┘  │
│       │          │          │           │            │
│       ▼          ▼          ▼           ▼            │
│  ┌─────────┐┌─────────┐┌─────────┐ ┌─────────┐       │
│  │WebEmbed ││WebEmbed ││WebEmbed │ │WebEmbed │       │
│  │         ││         ││         │ │         │       │
│  │WebView  ││WebView  ││WebView  │ │WebView  │       │
│  └─────────┘└─────────┘└─────────┘ └─────────┘       │
│                                                      │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Next.js Web App        │
              │ (couchers.org)         │
              │                        │
              │ • Client-side routing  │
              │ • URL-based i18n       │
              │ • Shared cookies       │
              │ • postMessage API      │
              └────────────────────────┘
```

## Why This Approach?

### ✅ Benefits

- **Rapid development**: Build features once, works on web + mobile
- **Feature parity**: Mobile automatically gets all web features
- **Single codebase**: Bug fixes apply to both platforms
- **Faster releases**: No need to rebuild features for mobile

### ⚠️ Trade-offs

- **Memory overhead**: Each tab has its own WebView (~50-100MB each)
- **Brief visual flash**: Sometimes visible when navigating to non-tab pages (due to switching WebView instances)
- **Sync complexity**: Two navigation systems must stay coordinated
- **Not "truly native"**: Won't feel as smooth as a pure native app

## Key Components

### WebEmbed (`components/WebEmbed.tsx`)

Wraps the React Native WebView and handles:

- Loading the web app with proper URLs
- Syncing when the mobile route changes
- Two-way communication via `postMessage`:
  - `LOGIN_SUCCESS` / `LOGOUT` → sync auth state
  - `COLOR_SCHEME_CHANGE` → sync dark mode
  - `REQUEST_IMAGE_PICK` → use native image picker
  - `MOBILE_NAVIGATE` → trigger web navigation without reload
  - `NATIVE_BACK` → web requests native back (goBack() or router.back())

**Critical setting**: `sharedCookiesEnabled={true}` keeps auth working.

### useWebNavigation (`hooks/useWebNavigation.ts`)

The "glue" that keeps mobile tabs in sync with web navigation:

**When web navigates** (user clicks link):

- Detects which page is showing in the WebView
- Maps web URL to a tab route and calls `router.navigate()` to keep tab highlights in sync
- Detail pages (profiles, events, etc.) stay in the originating tab's WebView — no native route change. This lets `goBack()` return to the tab page correctly without a router.back() → dashboard flash.

**Key insight**: Must strip locale prefixes before mobile navigation:

```typescript
// Web URL:    /en/users/123
// Mobile URL: /users/123  (no locale!)
```

### Global State (`state/webViewState.ts`)

Shared refs across all WebView instances:

- `globalWebPathRef` - current WebView location
- `lastMobileNavigationRef` - prevents infinite sync loops

**Note**: You may occasionally see a brief flash when navigating from tabs to non-tab pages. This happens because each screen has its own WebView instance that needs to mount. It's a known trade-off of the multi-WebView approach—the alternative (single WebView) would break tab state preservation.

### isNativeEmbed

The web app detects when it's running in the mobile app via `window.isNativeEmbed` (set by WebEmbed). Use the `useIsNativeEmbed()` hook to conditionally hide features that don't make sense in mobile, like "open in new tab" icons or external link behavior.

## Authentication Sync

Auth state exists in three places that must stay in sync:

1. **Backend session cookie** (gRPC backend)
2. **Native mobile state** (`AuthContext` - shows/hides login screen)
3. **WebView storage** (cookies + localStorage)

**How it works**:

- `sharedCookiesEnabled` means WebView and native app share cookies
- Web app sends `postMessage` when auth changes
- Mobile app updates its auth state and navigates accordingly
- `Stack.Protected` guards ensure users can't access tabs when logged out

## Routing Architecture

**The challenge**: Two different routing systems that need to stay in sync.

### Web App

- File-based (Next.js): `pages/[locale]/users/[id].tsx`
- URLs always have locales: `/en/dashboard`, `/de/users/123`
- Client-side routing is very fast (no reload)

### Mobile App

- File-based (Expo Router): `app/(tabs)/[...slug].tsx`
- Routes never have locales: `/dashboard`, `/users/123`
- i18n managed separately, not via URLs

### Route Types

**Tab routes** (show in bottom nav):

- `/(tabs)/dashboard.tsx` → Dashboard
- `/(tabs)/search.tsx` → Search
- `/(tabs)/messages.tsx` → Messages
- etc.

**Catch-all routes** (full-screen, no tabs):

- `/(tabs)/[...slug].tsx` → Everything else (profiles, message threads, etc.)
- Has `href: null` so it doesn't show in tab bar
- Has `animation: "none"` to reduce visual jank

### Critical: Exact Route Matching

Must match tabs exactly, not nested paths:

```typescript
// ❌ WRONG - catches nested paths
if (path.startsWith("/messages")) return "messages";

// ✅ CORRECT - only matches the tab
if (path === "/messages" || path.startsWith("/messages?")) return "messages";
```

Why: `/messages/chats/123` should go to the catch-all screen, not the messages tab.

## Common Issues & Solutions

### 1. Tabs highlight incorrectly

**Problem**: Profile page shows with search tab highlighted

**Cause**: Forgot to strip locale prefix before `router.push()`

```typescript
// ❌ router.push("/en/users/123")  // Locale prefix won't match!
// ✅ router.push("/users/123")     // Strips locale first
```

### 2. Infinite navigation loops

**Problem**: App freezes, keeps navigating back and forth

**Cause**: Sync loop - mobile nav triggers WebView sync, which triggers mobile nav...

**Solution**: Use `lastMobileNavigationRef` to skip sync when mobile initiated the nav:

```typescript
// Before mobile navigates
lastMobileNavigationRef.current = targetPath;
router.push(targetPath);

// In WebEmbed sync logic
if (lastMobileNavigationRef.current === targetPath) {
  lastMobileNavigationRef.current = null;
  return; // Skip this sync
}
```

### 3. Auth state out of sync

**Problem**: Logged in on web but mobile shows login screen (or vice versa)

**Solutions**:

- Verify `sharedCookiesEnabled={true}` on WebView
- Check postMessage handler is set up correctly
- Ensure web app sends `LOGIN_SUCCESS` / `LOGOUT` messages
- Confirm session cookie has correct domain/path

### 4. Back button on detail pages goes to the wrong place

**Problem**: User navigates from the search tab to a profile, then taps the back button — it goes to the dashboard instead of returning to search.

**Cause**: Detail pages stay in the originating tab's WebView (no native route change). Back button calls `sendNativeBack()` → `NATIVE_BACK` postMessage → `webviewRef.goBack()`, which navigates the WebView back through its browser history. `router.back()` is only the fallback when the WebView has no history (e.g. a deep link opened the `[...slug]` screen directly).

**Solution**: Detail page back buttons call `sendNativeBack()` (not `router.back()` directly). The native handler in `WebEmbed` calls `webviewRef.goBack()` when `canGoBackRef.current` is true, letting WebView browser history handle the navigation correctly.

### 5. Stale content (wrong version numbers, old data)

**Problem**: WebView shows outdated content

**Cause**: Aggressive caching

**Solution**:

```typescript
<WebView
  cacheEnabled={true}
  cacheMode="LOAD_DEFAULT"  // Revalidates, not "LOAD_CACHE_ELSE_NETWORK"
/>
```

## Debugging

### WebView Inspector

- **iOS**: Safari → Develop → [Device] → [App]
- **Android**: Chrome → `chrome://inspect` → Devices

Lets you see console.logs, inspect DOM, debug JavaScript in the WebView.

### Add Logging

```typescript
if (__DEV__) {
  console.log("WebView navigated to:", navState.url);
  console.log("Target route:", targetRoute, "vs current:", currentRoute);
  console.log("lastMobileNavigationRef:", lastMobileNavigationRef.current);
}
```

### Verify Route Mapping

Test that paths map to the right routes:

```typescript
getRouteNameForPath("/en/dashboard"); // "dashboard" ✓
getRouteNameForPath("/en/users/123"); // "[...slug]" ✓
getRouteNameForPath("/messages/chats/456"); // "[...slug]" NOT "messages"! ✓
```

## Testing Checklist

When making navigation or auth changes, verify:

**Navigation**:

- [ ] Tab to tab (all combinations work)
- [ ] Tab to non-tab (search → profile, dashboard → message thread)
- [ ] Non-tab to non-tab (profile → another profile)
- [ ] Back button (Android hardware button)
- [ ] Swipe back (iOS gesture)

**Auth**:

- [ ] Login on web → mobile state updates
- [ ] Logout on web → redirects to login screen
- [ ] Session persists after app restart
- [ ] NEXT_LOCALE cookie persists

**Locale**:

- [ ] Change language → persists across screens
- [ ] Language persists after restart

## Future Improvements (Not Planned)

These could improve UX but add significant complexity:

1. **Single shared WebView**: Use one WebView for all screens
   - Pros: Better memory usage, smoother transitions
   - Cons: Tab state not preserved, complex state management

2. **Native key screens**: Build profile/messages natively
   - Pros: Best performance, truly native feel
   - Cons: Code duplication, maintenance burden

3. **WebView pool**: Reuse instances instead of one per screen
   - Pros: Better memory usage
   - Cons: Very complex lifecycle management

## Conclusion

This hybrid approach prioritizes **development speed and code reuse** over native performance. It's the right choice for a small team that needs to move fast and maintain feature parity across platforms.

The key to making it work:

1. **Locale handling**: Always strip locales before mobile navigation
2. **Sync loop prevention**: Track mobile-initiated navigations
3. **Exact route matching**: Don't let nested paths match parent tabs
4. **Auth synchronization**: Keep cookies shared and postMessage flowing

Good luck! 🚀
