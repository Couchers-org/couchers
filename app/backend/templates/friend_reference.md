---
subject: "You've received a friend reference from {{ reference.from_user.name|couchers_escape }}!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ reference.to_user.name|couchers_escape }}!

{{ reference.from_user.name|couchers_escape }} just wrote a friend reference for you!

This is what they wrote:

"{{ reference.text|couchers_escape }}"

Thanks for using Couchers!

The Couchers.org team
