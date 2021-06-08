---
subject: "Confirm your new email for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ user.name|couchers_escape }}!

You requested that your email be changed to this email address on Couchers.org. Your old email address is {{ user.email|couchers_escape }}. This is the final step in the process.

To complete this change, please confirm your email by clicking the following link:

{% if html %}

{{ button("Confirm new email", confirmation_link) }}

Alternatively, click the following link: <{{ confirmation_link }}>.

{% else %}

<{{ confirmation_link }}>

{% endif %}

If you haven't already confirmed this change, you will still need a final confirmation via a similar email sent to your old email address.


If this wasn't you, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
