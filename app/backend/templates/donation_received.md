---
subject: "Thank you for your donation to Couchers.org!"
---

{% from "macros.html" import button, link, support_email %}

Dear {{ user.name|couchers_escape }},

Thank you so much for your donation of $ {{ amount }} to the Couchers.org Foundation.

Your contribution will go towards building and sustaining the Couchers.org platform and community, and is vital for our goal of a completely free and non-profit generation of couch surfing.

You can download an invoice and receipt for the donation here:

{% if html %}
{{ button("Invoice", receipt_url)|couchers_safe }}

Alternatively, click the following link: {{ link(receipt_url, html)|couchers_safe }}.
{% else %}
<{{ receipt_url|couchers_escape }}>
{% endif %}

If you have any questions about your donation, please email us at {% if html %}<a href="mailto:donations@couchers.org">donations@couchers.org</a>{% else %}<donations@couchers.org>{% endif %}.

Your generosity will help deliver the platform for everyone.

Thank you.

Aapeli and Itsi,
Couchers.org Founders
