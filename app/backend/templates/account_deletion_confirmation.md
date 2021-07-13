---
subject: "Confirm your Couchers.org account deletion"
---

{% from "macros.html" import button %}
Hi {{ user.name|couchers_escape }},

You requested that we delete your account from Couchers.org.

To complete this process, please confirm by clicking the following link:

{% if html %}

{{ button("Delete Account", confirmation_link) }}

Alternatively, click the following link: <{{ confirmation_link }}>.

{% else %}

<{{ confirmation_link }}>

{% endif %}

Please keep in mind that your account will be deleted approximately 48 hours after you click this link.


If you did not make this request, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
