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


If this wasn't you, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
