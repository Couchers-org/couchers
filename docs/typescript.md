# TypeScript errors

It's a pain, but it makes life easier in the long run.

Here's some common errors and some tricks on how to fix them.

## `Property 'something' does not exist on type CombinedVueInstance...`

If you keep getting this error, try adding return types to all your methods in the file that return something. See commit `6f3cc4f` which fixes the following error:

```
ERROR in /Users/aapeli/git/couchers/app/frontend/src/views/Profile.vue(319,12):
319:12 Property 'updateProfile' does not exist on type 'CombinedVueInstance<Vue, { loading: boolean; error: Error | null; user: AsObject; }, unknown, { lastActiveDisplay: unknown; joinedDisplay: unknown; lang
uagesListDisplay: unknown; countriesVisitedListDisplay: unknown; countriesLivedListDisplay: unknown; username: any; }, Readonly<...>>'.
    317 |       wrapper.setValue(color)
    318 |       req.setColor(wrapper)
  > 319 |       this.updateProfile(req)
        |            ^
    320 |     },
    321 |   },
    322 |
```
