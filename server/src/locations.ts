/** Clue text shown to players, plus short photo captions for the display board. */
export const LOCATIONS = [
  {
    clueText: "Take a photo of everyone's left foot in a circle.",
    photoCaption: "Left foot circle",
  },
  {
    clueText:
      "Find a place where prayers are sung and voices are hushed. Take a photo and strike a pose before you go.",
    photoCaption: "Chapel",
  },
  {
    clueText: "Write the initials 'STP' without using pen or paper.",
    photoCaption: "STP initials",
  },
  {
    clueText: "They see you come, they see you go. They are in the know. Who are they?",
    photoCaption: "In the know",
  },
  {
    clueText:
      "Gravity does most of the work here. Going up is considerably harder than going down.",
    photoCaption: "Going up",
  },
  {
    clueText: "Take a selfie of your team's reflection.",
    photoCaption: "Team reflection",
  },
  {
    clueText:
      "Find something old, tall and deeply rooted. This one holds a special message.",
    photoCaption: "Deeply rooted",
  },
  {
    clueText:
      "She doesn't teach lessons, she doesn't mark books and she doesn't attend staff meetings, but has watched over the girls for years. Who is she?",
    photoCaption: "Watching over",
  },
  {
    clueText: "Find the school's feathered VIPs and gather the flock for a photo.",
    photoCaption: "Feathered VIPs",
  },
  {
    clueText: "Find love somewhere on campus. A message, a couple, a heart, an object.",
    photoCaption: "Find love",
  },
] as const;

export function photoCaptionForOrderIndex(orderIndex: number): string {
  return LOCATIONS[orderIndex]?.photoCaption ?? "Photo";
}
