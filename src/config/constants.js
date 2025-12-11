export const DEMERITS = [
    "Bed not made or missing 341",
    "Mirror",
    "Vanity/Sink",
    "Dirty tile or Carpet",
    "Foul odor",
    "High dust or excessive clutter",
    "Trash",
    "Fridge, freezer, or microwave",
    "Shower curtain",
    "Bathtub/shower",
    "Excessive mold build-up",
    "Toilet",
    "Dirty bathroom tile, rugs, or towels"
];

export const AUTO_FAILURE_DEMERITS = [
    "HAZMAT",
    "Unsecured wall locker or keys",
    "Unsecured valuables or uniforms",
    "Unsecured prescription medications",
    "Unsecured Tobacco",
    "Unsecured perishable food",
    "Contraband",
    "Safety items/open window",
    "To-go container/pizza box"
];

export const INSPECTOR_NAMES = [
    'Hoskins',
    'Troope',
    'Smith',
    'Cherry',
    'Avila',
    'Young',
    'Grier'
];

export const ROOM_RANGES = {
    floor2: { start: 201, end: 299 },
    floor3: { start: 301, end: 399 }
};

export const SCORE_THRESHOLDS = {
    OUTSTANDING: 0,
    PASSED_MAX: 3,
    FAILED_MIN: 4
};

export const POINTS = {
    REGULAR_DEMERIT: 1,
    AUTO_FAILURE: 4
};

export const STORAGE_KEY = 'dormInspector';
