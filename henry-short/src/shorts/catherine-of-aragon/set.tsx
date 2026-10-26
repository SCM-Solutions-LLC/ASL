import React from "react";

// A cold stone hall, in stage units. Drawn wider and taller than 16:9 so the vertical crop never
// runs out of set. Deliberately plainer than the Anne short's: this beat is a court, not a party.
export const StoneHall: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 1360, background: "linear-gradient(#232b33, #39434d 45%, #5a6672)" }} />
    {[260, 660, 1060, 1460, 1860].map((x) => (
      <div key={x} style={{ position: "absolute", left: x - 130, top: 60, width: 260, height: 620, borderRadius: "130px 130px 0 0", background: "linear-gradient(#131a20, #26303a)", border: "10px solid #0e1319" }} />
    ))}
    <div style={{ position: "absolute", left: -400, right: -400, top: 820, height: 800, background: "linear-gradient(#4a5058, #171c21 60%)" }} />
  </>
);
