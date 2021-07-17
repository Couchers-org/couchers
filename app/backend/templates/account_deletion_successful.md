---
subject: "Your Couchers.org account will be deleted in 48 hours"
---

{% from "macros.html" import button %}
Hi {{ user.name|couchers_escape }},

You have successfully confirmed your account deletion request from Couchers.org.

This process will be completed in approximately 48 hours. If you would like to accelerate or cancel the process, please email support@couchers.org, and we will do our best to assist.

We are sad to see you go, but wish you the best in your future travels. You are always welcome back to the Couchers.org platform anytime :)


If you did not make this request, please contact us by emailing {% if html %}<a href="mailto:support@couchers.org">support@couchers.org</a>{% else %}<support@couchers.org>{% endif %} so we can sort this out as soon as possible!

The Couchers.org team
