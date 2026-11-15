import { DEFAULT_ESTIMATE_SETTINGS } from "@/utils/partVolumes";
import type { SavedLayoutSnapshot } from "@/utils/savedLayouts";

export interface ExampleProject {
  id: string;
  name: string;
  description: string;
  drawerSource: string;
  drawerSourceUrl: string;
  snapshot: SavedLayoutSnapshot;
}

const baseSnapshot = (drawerSize: SavedLayoutSnapshot["drawerSize"]): SavedLayoutSnapshot => ({
  drawerSize,
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 200, y: 200, z: 200 },
  bins: [],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
  screws: false,
  scoop: false,
  estimateSettings: DEFAULT_ESTIMATE_SETTINGS,
});

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    id: "kitchen-utensils",
    name: "Kitchen utensils",
    description: "Long bins for spatulas and ladles, short bins for cutlery and gadgets.",
    drawerSource: "IKEA ALEX drawer unit, interior measured",
    drawerSourceUrl: "https://theworkspacehero.com/alex-drawer-dimensions/",
    snapshot: {
      ...baseSnapshot({ width: 11.5, height: 20.6 }),
      bins: [
        { id: "kitchen-spatulas", x: 0, y: 0, width: 84, depth: 252, height: 6, label: "Spatulas" },
        { id: "kitchen-ladles", x: 0, y: 252, width: 84, depth: 252, height: 6, label: "Ladles" },
        { id: "kitchen-knives", x: 84, y: 0, width: 84, depth: 252, height: 6, label: "Knives & peelers" },
        { id: "kitchen-cutlery", x: 84, y: 252, width: 84, depth: 252, height: 3, label: "Cutlery" },
        { id: "kitchen-gadgets", x: 168, y: 0, width: 84, depth: 168, height: 6, label: "Gadgets" },
        { id: "kitchen-clips", x: 168, y: 168, width: 84, depth: 168, height: 3, label: "Clips & ties" },
        { id: "kitchen-tea", x: 168, y: 336, width: 84, depth: 168, height: 3, label: "Tea & coffee" },
      ],
    },
  },
  {
    id: "screws-fasteners",
    name: "Screws & fasteners",
    description: "A shallow-bin wall of screw sizes over deeper bins for bolts, nuts, and bits.",
    drawerSource: "Husky 52-in 18-drawer chest, full-length drawer",
    drawerSourceUrl:
      "https://www.homedepot.ca/product/husky-52-inch-18-drawer-mobile-tool-storage-chest-and-cabinet-set-in-black/1000804523",
    snapshot: {
      ...baseSnapshot({ width: 47.6, height: 15.8 }),
      bins: [
        { id: "screws-m3", x: 0, y: 0, width: 168, depth: 84, height: 3, label: "M3 screws" },
        { id: "screws-m4", x: 168, y: 0, width: 168, depth: 84, height: 3, label: "M4 screws" },
        { id: "screws-m5", x: 336, y: 0, width: 168, depth: 84, height: 3, label: "M5 screws" },
        { id: "screws-m6", x: 504, y: 0, width: 168, depth: 84, height: 3, label: "M6 screws" },
        { id: "screws-wood", x: 672, y: 0, width: 168, depth: 84, height: 3, label: "Wood screws" },
        { id: "screws-nails", x: 840, y: 0, width: 168, depth: 84, height: 3, label: "Nails" },
        { id: "screws-plugs", x: 1008, y: 0, width: 168, depth: 84, height: 3, label: "Wall plugs" },
        { id: "screws-bolts", x: 0, y: 84, width: 168, depth: 168, height: 6, label: "Bolts" },
        { id: "screws-nuts", x: 168, y: 84, width: 168, depth: 168, height: 6, label: "Nuts" },
        { id: "screws-washers", x: 336, y: 84, width: 168, depth: 168, height: 6, label: "Washers" },
        { id: "screws-anchors", x: 504, y: 84, width: 168, depth: 168, height: 6, label: "Anchors" },
        { id: "screws-hooks", x: 672, y: 84, width: 168, depth: 168, height: 6, label: "Hooks" },
        { id: "screws-brackets", x: 840, y: 84, width: 168, depth: 168, height: 6, label: "Brackets" },
        { id: "screws-spare", x: 1008, y: 84, width: 168, depth: 168, height: 6, label: "Spare parts" },
        { id: "screws-drill-bits", x: 0, y: 252, width: 168, depth: 126, height: 3, label: "Drill bits" },
        { id: "screws-driver-bits", x: 168, y: 252, width: 168, depth: 126, height: 3, label: "Screwdriver bits" },
        { id: "screws-glue", x: 336, y: 252, width: 168, depth: 126, height: 3, label: "Glue & tape" },
        { id: "screws-measuring", x: 504, y: 252, width: 168, depth: 126, height: 3, label: "Measuring" },
        { id: "screws-sandpaper", x: 672, y: 252, width: 168, depth: 126, height: 3, label: "Sandpaper" },
        { id: "screws-wire", x: 840, y: 252, width: 168, depth: 126, height: 3, label: "Wire & cable" },
        { id: "screws-odds", x: 1008, y: 252, width: 168, depth: 126, height: 3, label: "Odds & ends" },
      ],
    },
  },
  {
    id: "desk-tools",
    name: "Desk tools",
    description: "Pens and markers up top, cables and chargers below.",
    drawerSource: "Husky 52-in 18-drawer chest, right-hand drawer",
    drawerSourceUrl:
      "https://www.homedepot.ca/product/husky-52-inch-18-drawer-mobile-tool-storage-chest-and-cabinet-set-in-black/1000804523",
    snapshot: {
      ...baseSnapshot({ width: 13.9, height: 15.7 }),
      bins: [
        { id: "desk-pens", x: 0, y: 0, width: 84, depth: 168, height: 3, label: "Pens & pencils" },
        { id: "desk-markers", x: 84, y: 0, width: 84, depth: 168, height: 3, label: "Markers" },
        { id: "desk-scissors", x: 168, y: 0, width: 84, depth: 126, height: 3, label: "Scissors & cutters" },
        { id: "desk-tape", x: 168, y: 126, width: 84, depth: 42, height: 3, label: "Tape & glue" },
        { id: "desk-notes", x: 252, y: 0, width: 84, depth: 126, height: 3, label: "Sticky notes" },
        { id: "desk-clips", x: 252, y: 126, width: 84, depth: 42, height: 3, label: "Clips" },
        { id: "desk-cables", x: 0, y: 168, width: 168, depth: 126, height: 6, label: "Cables" },
        { id: "desk-chargers", x: 168, y: 168, width: 168, depth: 126, height: 6, label: "Chargers" },
        { id: "desk-notebook", x: 0, y: 294, width: 168, depth: 84, height: 3, label: "Notebook" },
        { id: "desk-sundries", x: 168, y: 294, width: 168, depth: 84, height: 3, label: "Sundries" },
      ],
    },
  },
  {
    id: "craft-sewing",
    name: "Craft & sewing",
    description: "Thread and scissors on the left, beads and yarn across the bottom.",
    drawerSource: "Husky 52-in 18-drawer chest, left-hand large drawer",
    drawerSourceUrl:
      "https://www.homedepot.ca/product/husky-52-inch-18-drawer-mobile-tool-storage-chest-and-cabinet-set-in-black/1000804523",
    snapshot: {
      ...baseSnapshot({ width: 31.6, height: 15.8 }),
      bins: [
        { id: "craft-thread", x: 0, y: 0, width: 126, depth: 252, height: 6, label: "Thread spools" },
        { id: "craft-needles", x: 126, y: 0, width: 84, depth: 126, height: 3, label: "Needles & pins" },
        { id: "craft-buttons", x: 126, y: 126, width: 84, depth: 126, height: 3, label: "Buttons" },
        { id: "craft-scissors", x: 210, y: 0, width: 84, depth: 252, height: 6, label: "Scissors" },
        { id: "craft-tape", x: 294, y: 0, width: 84, depth: 126, height: 3, label: "Measuring tape" },
        { id: "craft-chalk", x: 294, y: 126, width: 84, depth: 126, height: 3, label: "Chalk & markers" },
        { id: "craft-ribbons", x: 378, y: 0, width: 126, depth: 126, height: 6, label: "Ribbons" },
        { id: "craft-lace", x: 378, y: 126, width: 126, depth: 126, height: 6, label: "Lace & trim" },
        { id: "craft-fabric", x: 504, y: 0, width: 126, depth: 126, height: 6, label: "Fabric scraps" },
        { id: "craft-zippers", x: 504, y: 126, width: 126, depth: 126, height: 3, label: "Zippers" },
        { id: "craft-beads", x: 630, y: 0, width: 168, depth: 126, height: 3, label: "Beads" },
        { id: "craft-sequins", x: 630, y: 126, width: 168, depth: 126, height: 3, label: "Sequins" },
        { id: "craft-patterns", x: 0, y: 252, width: 252, depth: 126, height: 3, label: "Patterns" },
        { id: "craft-hoops", x: 252, y: 252, width: 252, depth: 126, height: 6, label: "Hoops" },
        { id: "craft-yarn", x: 504, y: 252, width: 168, depth: 126, height: 6, label: "Yarn" },
        { id: "craft-needles-long", x: 672, y: 252, width: 126, depth: 126, height: 6, label: "Knitting needles" },
      ],
    },
  },
];
