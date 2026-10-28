import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Every typeface ships in public/fonts and loads from there, so a frame draws the same on any machine.
// Asking for a system font instead renders whatever that machine has installed: the code used to ask
// for Arial Black and Georgia, the cloud renderer has neither and silently substituted, so framing
// checked there was measured in a face no other machine would draw. These are the faces it
// substituted, so pinning them left every rendered frame as it was.
const FACES = [
  { family: "Liberation Sans", file: "LiberationSans-Bold.ttf", weight: "700" },
  { family: "Liberation Serif", file: "LiberationSerif-Regular.ttf", weight: "400" },
  { family: "Liberation Serif", file: "LiberationSerif-Bold.ttf", weight: "700" },
  { family: "Inter", file: "Inter-Black.otf", weight: "900" },
];

for (const { family, file, weight } of FACES) loadFont({ family, url: staticFile(`fonts/${file}`), weight });

// Bold is the heaviest Liberation Sans there is, so the 800 and 900 the callouts ask for draw as Bold.
export const SANS = "'Liberation Sans', sans-serif";
export const SERIF = "'Liberation Serif', serif";
export const CAPTION = "Inter, sans-serif";
