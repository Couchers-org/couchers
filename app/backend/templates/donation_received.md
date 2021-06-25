---
subject: "Thank you for your donation to Couchers.org!"
---

{% from "macros.html" import button, link, support_email %}

Hi {{ user.name|couchers_escape }},

Thank you for your donation of $ {{ amount }} to the Couchers.org Foundation. Your donation makes our work and the wellbeing of the community possible, and the project wouldn't exist without the support of you and other financial contributors!

You can download an invoice and receipt for the donation here:

{% if html %}

{{ button("Invoice", receipt_url)|couchers_safe }}

Alternatively, click the following link: {{ link(receipt_url, html)|couchers_safe }}.

{% else %}
<{{ receipt_url|couchers_escape }}>
{% endif %}

Thank you for your contribution!

The Couchers.org team
