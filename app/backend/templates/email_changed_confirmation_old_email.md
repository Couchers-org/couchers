---
subject: "Confirm your new email for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ escape(user.name) }}!

You requested that your email be changed on Couchers.org.

The new email address is {{ escape(user.new_email) }}.

Please confirm you requested this change by clicking the following link:

{% if html %}

{{ button("Confirm new email", confirmation_link) }}

Alternatively, click the following link: <{{ confirmation_link }}>.

{% else %}

<{{ confirmation_link }}>

{% endif %}

If you haven't already confirmed this change, you will still need a final confirmation via a similar email sent to your new email address.


If this wasn't you, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
