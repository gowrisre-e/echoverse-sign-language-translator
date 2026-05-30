// ASL Gesture labels and mappings
// 39 classes: A-Z (26), 0-9 (10), Space, Delete, Nothing (3)

export const GESTURE_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'SPACE', 'DELETE', 'NOTHING'
];

export const LABEL_TO_INDEX = GESTURE_LABELS.reduce((acc, label, index) => {
  acc[label] = index;
  return acc;
}, {});

export const INDEX_TO_LABEL = GESTURE_LABELS.reduce((acc, label, index) => {
  acc[index] = label;
  return acc;
}, {});

export const NUM_CLASSES = GESTURE_LABELS.length;

// Control gestures
export const CONTROL_GESTURES = ['SPACE', 'DELETE', 'NOTHING'];

// Check if gesture is a control gesture
export const isControlGesture = (gesture) => CONTROL_GESTURES.includes(gesture);

// Get display character for gesture
export const getDisplayChar = (gesture) => {
  if (gesture === 'SPACE') return ' ';
  if (gesture === 'DELETE' || gesture === 'NOTHING') return '';
  return gesture;
};
