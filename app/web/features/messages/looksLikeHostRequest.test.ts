import { looksLikeHostRequest } from "./looksLikeHostRequest";

describe("looksLikeHostRequest", () => {
  it.each([
    "Hi! I'm in town for two nights next week, would that work for you?",
    "Could you host me from the 3rd to the 5th?",
    "Would you be willing to host a traveller this weekend?",
    "Hey, could I stay with you on Friday?",
    "I'm looking for a place to stay in Lisbon.",
    "Is your place free that weekend?",
    "Do you have space for two of us?",
    "Could I sleep on your couch for a night?",
    "Hola, busco alojamiento para el sábado.",
    "Olá, você poderia me hospedar?",
    "Hallo, könnte ich bei dir übernachten?",
    "Bonjour, pourrais-tu m'héberger ce week-end ?",
    "Ciao, cerco un posto per due notti.",
    "Привет, можно у тебя остановиться?",
    "Cześć, szukam noclegu na weekend.",
    "Merhaba, kalacak yer arıyorum.",
    "MERHABA, MISAFIR OLABILIR MIYIM?",
  ])("matches %j", (text) => {
    expect(looksLikeHostRequest(text)).toBe(true);
  });

  it.each([
    "Hi, how are you?",
    "Fancy a coffee while I'm in Berlin?",
    "I'd be happy to host you if you come through Oslo.",
    "I will stay there until Friday, want to meet up?",
    "I used to love couchsurfing before the paywall.",
    "Thanks for the couch request, sorry I can't make it.",
    "I love the nightlife in your city!",
    "I work at a coworking workspace downtown.",
  ])("does not match %j", (text) => {
    expect(looksLikeHostRequest(text)).toBe(false);
  });
});
