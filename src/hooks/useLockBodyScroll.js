import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let savedScrollY = 0;

/**
 * Custom React hook to disable background main page scrolling whenever a modal/dialog box is open.
 * Preserves the current scroll position without resetting to top.
 * 
 * @param {boolean} isOpen - Whether the dialog/modal is currently open
 */
export const useLockBodyScroll = (isOpen = true) => {
  useEffect(() => {
    if (!isOpen) return;

    if (lockCount === 0) {
      // Save original vertical scroll position
      savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Lock body scrolling without touching documentElement (which causes browsers to reset scroll position to 0)
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        // Revert overflow and padding back to original state when all modals close
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;

        // Ensure page scroll position is retained
        if (typeof window !== 'undefined') {
          const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
          if (Math.abs(currentY - savedScrollY) > 1) {
            window.scrollTo(0, savedScrollY);
          }
        }
      }
    };
  }, [isOpen]);
};

export default useLockBodyScroll;

