/**
 * Was the last thing the member did a key press, or a pointer press? A focus
 * moved by script paints a focus ring, and a ring after a mouse click reads
 * as a fault. So a view that wants to hand focus on asks this first: a remote
 * or a keyboard gets the hand-off, a mouse or a finger does not.
 */
let keyboard = false;

if (typeof document !== "undefined") {
  document.addEventListener(
    "keydown",
    () => {
      keyboard = true;
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    () => {
      keyboard = false;
    },
    true,
  );
}

export function lastInputWasKeyboard(): boolean {
  return keyboard;
}
