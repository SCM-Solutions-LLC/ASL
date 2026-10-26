import { buildFigure } from "./build";
import { KITS } from "./roster";
import { styleById } from "./styles";
import type { Kit, Style } from "./types";
import { drawnFaces, drawnRoles } from "../actors";
import { CHAR_SCALE as S, STAGE } from "../../layout";
import type { Actor } from "../../rig/cast";

// A kit becomes someone who can appear in a short. Everything a short needs — joints, faces, the
// height to stand at — comes out of the kit, so casting a new figure is naming them.
export const kitActor = (kit: Kit, style: Style, scale = S): Actor => {
  const { def, rest, drop } = buildFigure(kit, style);
  return {
    name: kit.id,
    def,
    scale,
    floor: STAGE.floor - drop * scale,
    // A doublet has a jaw that drops when he speaks; a gown does not.
    roles: kit.build === "doublet" ? { ...drawnRoles, jaw: "jaw" } : drawnRoles,
    faces: drawnFaces,
    rest,
  };
};

export const castFor = (styleId: string): Actor[] => KITS.map((k) => kitActor(k, styleById(styleId)));
