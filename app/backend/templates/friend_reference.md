---
subject: "You've received a friend reference!"
---

{% from "macros.html" import button %}

Hi {{ escape(reference.to_user.name) }}!

{{ escape(reference.from_user.name) }} just wrote a friend reference for you!

This is what they wrote:

"{{ escape(reference.text) }}"

Thanks for using Couchers!

The Couchers.org team
