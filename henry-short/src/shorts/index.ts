import { anneOfCleves } from "./anne-of-cleves";
import { scaleOfTheSun } from "./scale-of-the-sun";
import { catherineOfAragon } from "./catherine-of-aragon";
import { ageOfSunlight } from "./age-of-sunlight";
import { deepestHole } from "./deepest-hole";
import { cellCount } from "./cell-count";
import { cleopatraTimeline } from "./cleopatra-timeline";
import { cleopatraDoodle } from "./cleopatra-doodle";
import type { Short } from "./types";

// Every short in the channel. Listing one here registers its compositions — one per look, per
// format. `npm run new-short <slug>` scaffolds the files.
export const SHORTS: Short[] = [anneOfCleves, catherineOfAragon, scaleOfTheSun, ageOfSunlight, deepestHole, cellCount, cleopatraTimeline, cleopatraDoodle];
