# Backend team meeting #28

When: 21/7/21, 20:00 UTC.
Attending: Aapeli, Lucas, Sam

## Notes

* 2.5k users!
* Postmortems
  - When stuff breaks seriously in prod
  - We'll start writing some documents that explain what went wrong, how it slipped through, and what process things to change to avoid that in the future
  - Not blaming anybody: just trying to figure out how to refine our process to avoid breaking the product for users!
* Third party client stuff?
* We should send the community guidelines content from the backend to help standardise across our frontends
  - Aapeli will do that
* Account deletion
  - Deletion step 1: user fills in frontend form with optional reason field, which posts to backend (with a confirmation boolean)
  - Deletion step 2: we send a confirmation email with a unique link valid for a few hours (and in the future a link to download their data)
  - Deletion step 3: user clicks confirmation link which sets a time_deleted to now(), which hides the user; we send a notification of deletion email to the user (with steps to undelete)
  - Deletion step 4: after some time, the user's data is purged from the system fully
  - Undeletion: if user logs back in between steps 3 & 4, we automatically undelete the user and send an email to them notifying that the user was undeleted
