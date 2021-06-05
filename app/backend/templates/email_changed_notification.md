---
subject: "Couchers.org email change requested"
---

Hi {{ user.name|couchers_escape }}!

You requested that your email on Couchers.org be changed to:

{{ user.new_email|couchers_escape }}

A confirmation was sent to that email address, and you'll need to confirm it to complete the change.

If this wasn't you, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
