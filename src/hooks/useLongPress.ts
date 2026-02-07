import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 450 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const isActive = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    isActive.current = true;
    timerRef.current = setTimeout(() => {
      if (isActive.current) {
        isLongPress.current = true;
        onLongPress();
      }
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    isActive.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleEnd = useCallback(() => {
    cancel();
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [cancel, onClick]);

  return {
    onPointerDown: start,
    onPointerUp: handleEnd,
    onPointerLeave: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      // Prevent native context menu on long press
      if (isLongPress.current) {
        e.preventDefault();
      }
    },
  };
}
