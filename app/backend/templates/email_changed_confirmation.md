---
subject: "Confirm your new email for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ user.name|couchers_escape }}!

You asked for your email to be changed on Couchers.org. To complete this change, please confirm your email by clicking the following link:

{% if html %}

{{ button("Confirm new email", confirmation_link)|couchers_safe }}

Alternatively, click the following link: <{{ confirmation_link|couchers_escape }}>.

{% else %}

<{{ confirmation_link|couchers_escape }}>

{% endif %}


If this wasn't you, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
