export type Waypoint = {
  id: string;
  label: string;
  t: number; // normalized position on path 0..1
};

export const WAYPOINTS: Waypoint[] = [
  { id: "start", label: "Start", t: 0 },
  { id: "box1", label: "Main box", t: 0.2 },
  { id: "box2", label: "Blue box", t: 0.45 },
  { id: "sphere", label: "Sphere", t: 0.7 },
  { id: "end", label: "Loop", t: 1 },
];
