---
subject: "Your Couchers.org account has been recovered!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }}!

You have successfully recovered your account on Couchers.org!

We are so glad you decided to stay!

If you change your mind, you can delete your account at any time.


If this wasn't you, please contact us by emailing {{ support_email(html)|couchers_safe }} so we can sort this out as soon as possible!

The Couchers.org team
