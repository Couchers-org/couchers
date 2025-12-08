# Couchers.org Mobile App - Testing Instructions

## Request Access to Beta Testing

**Before you can test the app, you need to request be added as a tester.**

Reach out to @aapeli or @nabramow and make sure to include:
- Your first and last name
- The email address associated with your Apple ID (for iOS testing)
- The email address associated with your Google Play account (for Android testing)
- These can be the same email or different emails

Once you're added, you'll receive an invitation email within 24-48 hours.

---

## iOS Testing (TestFlight)

### Step 1: Install TestFlight
1. Download **TestFlight** from the App Store (it's free)
2. Open TestFlight on your iPhone/iPad

### Step 2: Accept the Invitation
1. You'll receive an email invitation to test the Couchers app
2. Tap **"View in TestFlight"** in the email
3. Or tap the invitation link if sent via text/message

### Step 3: Install the App
1. In TestFlight, tap **"Accept"** to join the beta
2. Tap **"Install"** to download the Couchers app
3. Wait for installation to complete

### Step 4: Open and Test
1. Open the **Couchers** app from your home screen
2. Log in with your **production Couchers.org account** (same login as the website)
3. Test the app and report any issues you find

### Getting Updates
- TestFlight will notify you when new test versions are available
- Open TestFlight and tap **"Update"** next to Couchers

---

## Android Testing (Google Play Internal Testing)

### Step 1: Enable Internal App Sharing (One-Time Setup)
1. Open **Play Store** on your Android device
2. Tap your **profile picture** (top right) → **Settings**
3. Tap **About** at the bottom
4. Tap **Play Store version** seven times until you see "You are now a developer!"
5. Go back to Settings → You'll now see **Internal app sharing** (turn it ON)

### Step 2: Accept the Invitation
1. You'll receive an email invitation to test the Couchers app
2. Tap **"Become a tester"** in the email
3. You'll be taken to the Google Play Store

### Step 3: Install the App
1. In the Play Store, tap **"Install"** or **"Update"**
2. Wait for installation to complete
3. Tap **"Open"**

### Step 4: Open and Test
1. Open the **Couchers** app from your home screen
2. Log in with your **production Couchers.org account** (same login as the website)
3. Test the app and report any issues you find

### Getting Updates
- Google Play will automatically notify you of updates
- Open the Play Store → tap your profile → **"Manage apps & device"** → **"Updates available"**

---

## Important Notes

✅ **Use your regular Couchers.org account** - this is the production app, not a staging/test environment

✅ **This is a beta version** - you may encounter bugs. Please report them!

✅ **Your feedback matters** - let us know what works, what doesn't, and what could be better

## Reporting Issues

Please report any bugs or issues by contacting [your contact method here - e.g., email, Slack, GitHub, etc.]

Include:
- What you were trying to do
- What happened (expected vs actual)
- Screenshots if possible
- Your device model and OS version

---

# Admin Instructions: Adding Testers

*The following section is for admins (@aapeli, @nabramow) who need to add new testers.*

## Adding iOS Testers (TestFlight)

### Step 1: Go to App Store Connect
1. Navigate to: https://appstoreconnect.apple.com/
2. Sign in with your Apple ID
3. Click **"My Apps"**
4. Select **"Couchers.org"** (bundle ID: `org.couchers.ios`)

### Step 2: Navigate to TestFlight
1. Click the **"TestFlight"** tab at the top
2. In the left sidebar, under "Internal Testing", click on a test group
   - If no group exists, create one by clicking the **"+"** button next to "Internal Testing"

### Step 3: Add Testers
1. Click **"Testers"** (or the **"+"** button)
2. Click **"Add Testers"**
3. Enter the tester's:
   - **First Name**
   - **Last Name**
   - **Email** (must be their Apple ID email)
4. Click **"Add"**

### Step 4: Assign to Build
1. Make sure the test group has the latest build assigned
2. Testers will automatically receive an email invitation to test

### Notes for iOS
- **Internal testers** (Apple Developer team members): Up to 100 testers, no review needed
- **External testers** (anyone): Up to 10,000 testers, requires Apple's review (1-2 days)
- Testers must have TestFlight app installed on their iOS device

---

## Adding Android Testers (Google Play Internal Testing)

### Step 1: Go to Google Play Console
1. Navigate to: https://play.google.com/console
2. Sign in with your Google account
3. Select **"Couchers"** app (package: `org.couchers.android`)

### Step 2: Navigate to Internal Testing
1. In the left sidebar, go to **"Testing" → "Internal testing"**
2. Scroll down to the **"Testers"** section

### Step 3: Create or Edit Email List
1. Click **"Create email list"** (or edit existing list)
2. Give it a name (e.g., "Internal Testers")
3. Add tester email addresses:
   - Enter emails one per line, or
   - Upload a CSV file with emails
4. Click **"Save changes"**

### Step 4: Make Release Available
1. Make sure you have a release in the "Internal testing" track
2. The testers will see a shareable link they can use to opt-in

### Step 5: Share the Opt-In Link
1. In the "Testers" section, you'll see a **"Copy link"** button
2. Copy the opt-in link
3. Send this link to your testers via email/Slack/etc.

**Alternatively:** Testers can be added automatically if they're in the email list and you have auto-enrollment enabled.

### Notes for Android
- **Internal testing**: Up to 100 testers
- Testers need a Google account and must opt-in via the link
- No review required for internal testing

---

## Quick Reference

| Platform | Max Testers | Review Required? | Email Required |
|----------|-------------|------------------|----------------|
| iOS Internal | 100 | No | Apple ID email |
| iOS External | 10,000 | Yes (1-2 days) | Any email |
| Android Internal | 100 | No | Google account email |
| Android Beta | Unlimited | No | Google account email |

---

## Common Issues

### iOS: "Tester not receiving invite"
- ✅ Check email is correct Apple ID
- ✅ Check spam/junk folder
- ✅ Resend invitation from TestFlight

### Android: "Can't access test" or "App not installing"
- ✅ Make sure **Internal app sharing** is enabled (see Step 1 above)
- ✅ Make sure tester clicked the opt-in link
- ✅ Check they're signed into correct Google account
- ✅ Verify email is in the tester list

### Both: "Build not showing up"
- ✅ Wait for build processing (can take 10-30 min)
- ✅ Check build was successfully submitted
- ✅ Check tester group has build assigned

