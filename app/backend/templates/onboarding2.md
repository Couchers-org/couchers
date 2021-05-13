---
subject: "Complete your profile on Couchers.org"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

We hope you've taken a bit of time to look around the new Couchers.org platform.

We would ask one big favour of you: please fill out your profile by adding a photo and some text.

{% if html %}

{{ button("Go to your profile", profile_link) }}

{% else %}

Link to profile page: <{{ profile_link }}>

{% endif %}

A big problem that platforms like Couchsurfing have is that there are so many empty accounts, and we want to avoid that, especially at this early stage.

We would really appreciate it if you could add a photo and fill in at least the "Who I am" section of your profile, although a full profile would be even better! It's an easy way to make this new platform look great, and it'll mean you're set up for when people start using the platform to start couch surfing.


Thank you so much!

Emily from Couchers.org  
[community@couchers.org](mailto:community@couchers.org)
