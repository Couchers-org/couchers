# Translator Contribution Instruction

Couchers is using [Weblate](https://weblate.org/) to translate the messages used throughout our web and mobile app.

If you wish to help translate our app, please begin by creating an account on Weblate.

## Finding messages that require translations

1. Once you have created and signed in to your Weblate account, Go to the [Couchers project](https://hosted.weblate.org/projects/couchers/).

2. You should be shown a page with the list of our app's "component" that may need translating. Begin by clicking on any component that has a red bar, which indicates certain messages are missing a translation (i.e. where we need your help).

3. Once you are at an individual component, click on a language (that you write fluently in) that has a red bar, which will take you to the next screen showing the translation status for that component's language.

4. Click on "Not translated strings - X words" (where X is the actual number of not translated words) to go to the screen that shows you the list of messages that need translating.

5. You should now see an editor with the English message as reference above. Write in the translation for your language. In particular, take special care with messages in between double braces - e.g. `{{val, currency}}`. They are special placeholder value we use in our code and should
   not be changed. If they need to appear in a different order, please move everything between the double braces as it appears.

6. Once you have written your translation, click the "Suggest" button to send a translation for our team to review.

## Missing languages

Are you fluent in a language you want to help us but you can't find it? Send us a request to add the language to the project!

1. Follow step 1 and 2 in the [Finding messages that require translations](#finding-messages-that-require-translations) section above.

2. Click the "Start new translation" button in the individual component's page.

3. Choose the language you want to help us in, then click the "Request new translation" button to notify us to add the language to the list.
