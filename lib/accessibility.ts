import { useEffect, useId, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";

export const SECONDARY_TEXT_COLOR = "var(--color-text-secondary)";
export const TOUCH_TARGET_SIZE = "var(--touch-target-min)";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

export function moveFocusWithArrows(
  event: ReactKeyboardEvent<HTMLElement>,
  elements: HTMLElement[],
  orientation: "horizontal" | "vertical" = "horizontal"
) {
  const keyMap = orientation === "horizontal"
    ? { previous: "ArrowLeft", next: "ArrowRight" }
    : { previous: "ArrowUp", next: "ArrowDown" };

  if (event.key !== keyMap.previous && event.key !== keyMap.next) return;
  if (!elements.length) return;

  const currentIndex = elements.findIndex((element) => element === document.activeElement);
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = event.key === keyMap.next
    ? (fallbackIndex + 1) % elements.length
    : (fallbackIndex - 1 + elements.length) % elements.length;

  event.preventDefault();
  elements[nextIndex]?.focus();
}

export function useAccessibleDialog(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>
) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = getFocusableElements(dialog);
    const preferredTarget = initialFocusRef?.current ?? focusables[0] ?? dialog;
    window.setTimeout(() => preferredTarget?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const activeElements = getFocusableElements(dialog);
      if (!activeElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = activeElements[0];
      const last = activeElements[activeElements.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousActive?.focus();
    };
  }, [open, dialogRef, initialFocusRef, onClose]);

  return { titleId, descriptionId };
}
