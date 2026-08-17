import { useEffect } from 'react';

/**
 * Custom React hook to disable background main page scrolling whenever a modal/dialog box is open.
 * Restores original body and html scroll styles when closed or unmounted.
 * 
 * @param {boolean} isOpen - Whether the dialog/modal is currently open
 */
export const useLockBodyScroll = (isOpen = true) => {
  useEffect(() => {
    if (!isOpen) return;

    // Capture original overflow style values
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock page background scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Revert overflow back to original state when modal closes
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);
};

export default useLockBodyScroll;
