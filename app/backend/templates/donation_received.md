---
subject: "Thank you for your donation to Couchers.org!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Dear {{ user.name|couchers_escape }},

Thank you so much for your donation of ${{ amount|couchers_safe }} to Couchers.org.

Your contribution will go towards building and sustaining the Couchers.org platform and community, and is vital for our goal of a completely free and non-profit generation of couch surfing.

You can download an invoice and receipt for the donation here:

{% if html %}
{{ button("Invoice", receipt_url)|couchers_safe }}

Alternatively, click the following link: {{ link(receipt_url, html)|couchers_safe }}
{% else %}
<{{ receipt_url|couchers_safe }}>
{% endif %}

If you have any questions about your donation, please email us at {{ email_link("donations@couchers.org", html)|couchers_safe }}

Your generosity will help deliver the platform for everyone.

Thank you.

Aapeli and Itsi,{{ newline(html)|couchers_safe }}
Couchers.org Founders
