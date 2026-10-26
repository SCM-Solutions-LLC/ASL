import { anneOfCleves } from "./anne-of-cleves";
import { catherineOfAragon } from "./catherine-of-aragon";
import type { Short } from "./types";

// Every short in the channel. Listing one here registers its compositions — one per look, per
// format. `npm run new-short <slug>` scaffolds the files.
export const SHORTS: Short[] = [anneOfCleves, catherineOfAragon];
