# How uploads work

1. You call `org.couchers.api.core.API.InitiateMediaUpload`, which returns an `upload_url` and an expiry time
2. You POST a JPEG to the given `upload_url` (before it expires) as you would in any other file upload situation
3. If the POST succeeds, you get back a HTTP 200 response with JSON of the form `{"ok": true, "key": "31e515a6899b30fed40dce49505be6e5aa3d4d309278205a71a33b137db33d0a"}` (failures give you HTTP error codes)
4. You can now use the `key` in various update RPCs, e.g. as `avatar_key` in `org.couchers.api.core.API.UpdateProfileReq`

Dangling uploads (thsoe never used in content) may be deleted.
