# Release Checklist

Here are all the steps that need to be done for each official Couchers release.

## Before you start
[] Do a post in the #couchops channel for any operations, translation, merch, etc. accomplishments that should also be included in the release blog post.
[] Check if there are any recruitment needs that should be shouted out in the "Volunteer Needs at Couchers" section of the blog post.
[] This could also be a good time to add/remove positions from our volunteer page if they are no longer relevant

# Dev Tasks
[] Increment version number in web `package.json` and `app/version`. Usually we bump in a minor version for a quarterly release.
[] Get the list of completed PRs from Aapeli and separate into categories of features
[] Create markdown file blog post for new release in `app/web/markdown/blog` within the correct year, month and day folders. Either write it in there, or if a non-dev has written the post, paste it in and fix up the markdown formatting.
[] Add any CouchOps accomplishments that are not included in the PRs to the post. Update the "Volunteer Needs at Couchers" section as needed.
[] Take screenshots of any new relevant features. Make sure no sensitive user data is in the screenshots and use staging if necessary. Add these to the markdown blog post, look at previous posts for how to do it and center them.
[] Create a new entry in `app/web/dashboardNews.json` at the top
[] Add or replace current dashboard news widget in `app/web/features/dashboard/Dashboard.tsx`
[] Update the the activeness probe with the new release blog post in `app/backend/templates/v2/activeness_probe.txt` and `app/backend/templates/v2/activeness_probe.mjml`. Follow the instructions in `app/backend/templates/v2/readme.md` to regenerate the html templates.
[] Merge blog post PR with the above changes and deploy via `ops.couchershq.org`
[] Send blog post notification

# Non-dev tasks
[] Copy the markdown from the completed blog post into a new Listmonk newsletter and add the `Dear Hi {{ .Subscriber.FirstName }}` and the signature
[] Upload the screenshots into the Media section of Listmonk and fix up the images in the newsletter. You can look at past newsletters for reference.
[] Preview newsletter and once you're sure it's okay and the text has been looked over by Aapeli, Jesse and/or Nicole, start campaign
[] Create social media graphics in Canva Couchers account using the release template. The slides just need to be updated with the new features and the version number
[] Write a caption and add #couchersorg and any other relevant hashtags and post from the official Couchers.org Instagram, Tiktok and Bluesky accounts (Instagram will post to Facebook automatically). Share to stories as well when relevant.
[] Post the social media links on Slack so volunteers can share or repost if they want
[] Write a shortened version of the release blog post (without the PRs) and post to the Couchersorg own reddit channel from the official Couchers reddit account
