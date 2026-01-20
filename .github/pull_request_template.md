*Describe briefly what this PR is doing and why.*

<!--
Reference issues with "closes #1234", or simply "#1234" if not closing.
-->

## Testing
*Explain how you tested this PR and give clear steps so the reviewer can replicate.*

<!--
Include any necessary dev environment adjustments such as editing .env files.
Fill applicable checklists below, or remove those that don't apply.
-->

**Backend checklist**
<!-- To avoid CI failures, first run `make format` in app/backend and run tests locally. -->
- [ ] Added tests for any new code or added a regression test if fixing a bug
- [ ] Run the backend locally and it works
- [ ] Added migrations if there are any database changes, rebased onto `develop` if necessary for linear migration history

**Web frontend checklist**
<!-- To avoid CI failures, first run `yarn format` and `yarn lint --fix` in app/web, and run tests locally. -->
- [ ] There are no console warnings when running the app
- [ ] Added tests where relevant
- [ ] Clicked around my changes running locally and it works
- [ ] Checked Desktop, Mobile and Tablet screen sizes

## Merging
<!-- Untick the following if you'd prefer that maintainers don't push commits/merge your branch. -->
- [x] Maintainers can push commits to my branch
- [x] Maintainers can merge this PR for me

<!--
Remember to request review from couchers-org/web, couchers-org/backend or an individual.
Once your code is approved, you can merge it if you have write access.
--->
