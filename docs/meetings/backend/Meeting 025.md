# Backend team meeting #25

When: 9/6/21, 20:00 UTC.
Attending: Aapeli, Austin, Christian, Eric, Lucas, Sam

## Notes

* Introductions: Eric and Austin are new! Thanks for joining the team!
* Talking about woes of Ubuntu and Python 3.9: we should downgrade to 3.8, all we use from 3.9 is functools.cache
* Outside dev:
  - Working on getting more regular schedule (doing great with bi-weekly meetings on dev side)
  - Starting new monthly full team meetings every second Sunday at 14:00 UTC: be there!
* Fixed a security bug:
  - Email generator would render any Markdown and/or HTML, was noticed by Aapeli and probably not abused
  - The fix broke password changing in that fix (due to email template error)
  - Password changing was fixed in <15h after it broke thanks to bug report
* Phone verification/sending SMSs: talking to a a twilio dev who might be able to help, so waiting for that
* Real-time notification subsystem design doc (#557): Aapeli will work on this with Lennart
* Current PR: protobuf relative imports (#1397), Aapeli will help figure out non-python langs because Christian uses his own script
* Current PR: protobuf option–based auth (#1373), Christian is reviewing and will hash it out with Aapeli on GitHub
* Logs needs to be moved out of DB pretty soon (#1313): some kind of OLAP database, Lennart?
* Splitting users table into at least two parts (#898): maybe Lennart can work on this too
* l18n (localization): in particular date time display formats in emails and elsewhere, something like http://cldr.unicode.org/, seems to be a pain
* Statistics collection system: collect useful info about what features are used, and how; mainly a frontend thing
* Aapeli is busy for about a week til next Tuesday
* Lucas:
  - Can we piggyback off GCM or APSN for notifications?
  - We should read their docs in detail before working on this, and see what they provide before doing our own thing
  - Aapeli has had a brief look: looks like they do delivery but a lot will be left to us
  - Do they provide a feature to cancel notifications on other devices if seen on one?
* Eric:
  - Map location randomization is a problem for data privacy
  - There is an issue but it's been dormant for a bit: #1065
  - Randomization is done automatically but can be adjusted by the user: this is confusing
  - For now it'll be just a note under the map explaining this
  - This is confusing and should be re-worked later, but that's a frontend thing?
* What everyone is working on:
  - Sam: email verification for changing your email (#1040, #912)
  - Christian: downgrade to python 3.8 (#1399); will help Aapeli out on signup flow v2 (#1218)
  - Eric: unfriending feature (#936)
  - Austin: sending a notification email on friend request accepted (#1013)
  - Lennart: is traveling this week, has a lot of time so will help out on a lot of things in the next 2 weeks
