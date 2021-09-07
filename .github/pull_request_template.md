<!---
Please describe the pull request below.
If it closes an issue, make sure to write "closes #1234"
If there is an issue but it isn't completely closed, still refer to the issue number, eg. "part of #1234"
--->


<!---
Checklists - you can remove one that is not applicable (ie. remove backend checklist if you only worked on the web frontend)
If you need help with any of these, please ask :)
--->
**Backend checklist**
- [ ] Formatted my code by running `autoflake -r -i --remove-all-unused-imports src && isort . && black .` in `app/backend`
- [ ] Added tests for any new code or added a regression test if fixing a bug
- [ ] All tests pass
- [ ] Run the backend locally and it works
- [ ] Added migrations if there are any database changes, rebased onto `develop` if necessary for linear migration history

**Web frontend checklist**
- [ ] Formatted my code with `yarn format && yarn lint --fix`
- [ ] There are no warnings from `yarn lint`
- [ ] There are no console warnings when running the app
- [ ] Added any new components to storybook
- [ ] Added tests where relevant
- [ ] All tests pass
- [ ] Clicked around my changes running locally and it works
- [ ] Checked Desktop, Mobile and Tablet screen sizes


<!---
Remember to request review from couchers-org/web, couchers-org/@backend or an individual.
Once your code is approved, remember to merge it if you have write access
--->
