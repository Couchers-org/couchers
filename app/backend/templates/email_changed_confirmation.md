---
subject: "Confirm your new email for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ escape(user.name) }}!

You asked for your email to be changed on Couchers.org. To complete this change, please confirm your email by clicking the following link:

{% if html %}

{{ button("Confirm new email", confirmation_link) }}

Alternatively, click the following link: <{{ confirmation_link }}>.

{% else %}

<{{ confirmation_link }}>

{% endif %}


If this wasn't you, please contact us so we can sort this out!

The Couchers.org team
