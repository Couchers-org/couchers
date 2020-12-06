---
subject: "Reset your Couchers.org password"
---

{% from "macros.html" import button %}
Hi {{ escape(user.name) }}!

You asked for your password to be reset on Couchers.org.

{% if html %}

{{ button("Reset password", password_reset_link) }}

Alternatively, click the following link: <{{ password_reset_link }}>.

{% else %}

<{{ password_reset_link }}>

{% endif %}


If this wasn't you, please contact us so we can sort this out!

The Couchers.org team
