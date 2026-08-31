import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, memo } from 'react';
import { useNavigate, useLocation, useInRouterContext } from 'react-router-dom';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { TABS } from '../constants/constants';

export const getActiveTabId = (activeOption) => {
  if (activeOption === 'datatables') return 'datatables';
  for (const tab of TABS) {
    if (tab.type === 'single' && (tab.optionId === activeOption || tab.id === activeOption)) {
      return tab.id;
    }
    if (tab.type === 'dropdown' && tab.items.some(item => item.id === activeOption)) {
      return tab.id;
    }
  }
  return 'datatables';
};

// Safe router hook wrapper
const useSafeRouter = () => {
  const inRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  let navigate = null;
  let location = { pathname: typeof window !== 'undefined' ? window.location.pathname : '/' };

  if (inRouter) {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      navigate = useNavigate();
      // eslint-disable-next-line react-hooks/rules-of-hooks
      location = useLocation();
    } catch {
      // Fallback
    }
  }

  return { navigate, location };
};

const NavigationRow = memo(({ activeOption: propActiveOption, onSelectOption: propOnSelectOption }) => {
  const ctx = useDiffChecker();
  const activeOption = propActiveOption || ctx.activeOption;
  const onSelectOption = propOnSelectOption || ctx.handleSelectOption;
  const basePath = ctx.basePath !== undefined ? ctx.basePath : '/diff-checker';

  const { navigate, location } = useSafeRouter();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const tabRefs = useRef({});
  const navContainerRef = useRef(null);
  const navInnerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Clean base path without trailing slash
  const cleanBasePath = useMemo(() => {
    if (!basePath) return '';
    const trimmed = basePath.trim();
    if (trimmed === '/') return '';
    return trimmed.replace(/\/+$/, '');
  }, [basePath]);

  // Helper to build full route path
  const buildFullPath = (subPath) => {
    if (!subPath || subPath === '/') {
      return cleanBasePath || '/';
    }
    const cleanSub = subPath.startsWith('/') ? subPath : `/${subPath}`;
    return `${cleanBasePath}${cleanSub}`;
  };

  const currentActiveOption = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, '') || '/';
    const rootPath = cleanBasePath || '/';

    if (currentPath === rootPath || currentPath === '' || currentPath === '/') {
      return 'datatables';
    }

    for (const tab of TABS) {
      if (tab.type === 'single') {
        const fullTabPath = buildFullPath(tab.path).replace(/\/+$/, '') || '/';
        if (currentPath === fullTabPath || (tab.path && currentPath.endsWith(tab.path))) {
          return tab.optionId;
        }
      }
      if (tab.type === 'dropdown') {
        const found = tab.items.find(item => {
          const fullItemPath = buildFullPath(item.path).replace(/\/+$/, '') || '/';
          return currentPath === fullItemPath || (item.path && currentPath.endsWith(item.path));
        });
        if (found) return found.id;
      }
    }
    return activeOption || 'datatables';
  }, [location.pathname, cleanBasePath, activeOption]);

  const activeTabId = getActiveTabId(currentActiveOption);

  const updateIndicator = () => {
    const container = navContainerRef.current;
    const activeEl = tabRefs.current[activeTabId];
    if (container && activeEl) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
    const activeEl = tabRefs.current[activeTabId];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [currentActiveOption, activeTabId]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    const navInner = navInnerRef.current;
    if (navInner) {
      navInner.addEventListener('scroll', updateIndicator, { passive: true });
    }
    const animId = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 150);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      if (navInner) {
        navInner.removeEventListener('scroll', updateIndicator);
      }
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, [currentActiveOption, activeTabId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = (targetPath) => {
    const fullPath = buildFullPath(targetPath);
    if (navigate) {
      navigate(fullPath);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', fullPath);
    }
  };

  const handleTabClick = (tab) => {
    if (tab.type === 'single') {
      if (onSelectOption) onSelectOption(tab.optionId, tab.title);
      navigateTo(tab.path);
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(prev => (prev === tab.id ? null : tab.id));
    }
  };

  const handleSelectItem = (item) => {
    if (onSelectOption) onSelectOption(item.id, item.label);
    navigateTo(item.path);
    setOpenDropdownId(null);
  };

  return (
    <div className="dc-nav" ref={navContainerRef}>
      <div className="dc-nav-inner" ref={navInnerRef}>

        {/* Navigation Tabs List */}
        <div className="dc-nav-tabs">
          {TABS.map((tab, index) => {
            const isTabActive = activeTabId === tab.id;
            const isOpen = openDropdownId === tab.id;
            const isRightAligned = index >= TABS.length - 2;

            if (tab.type === 'single') {
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => handleTabClick(tab)}
                  className={`dc-nav-tab-btn ${isTabActive ? 'active' : ''}`}
                >
                  {tab.title}
                </button>
              );
            }

            return (
              <div key={tab.id} className="dc-nav-dropdown-wrapper">
                <button
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => handleTabClick(tab)}
                  className={`dc-nav-dropdown-btn ${isTabActive ? 'active' : ''}`}
                >
                  <span>{tab.title}</span>
                  <svg
                    className={`dc-nav-dropdown-icon ${isOpen ? 'open' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* DROPDOWN MENU CARD */}
                {isOpen && (
                  <div className={`dc-nav-dropdown-menu ${isRightAligned ? 'dc-nav-dropdown-menu-right' : ''}`}>
                    {tab.items.map((item) => {
                      const isOptionSelected = currentActiveOption === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`dc-nav-dropdown-item ${isOptionSelected ? 'active' : ''}`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ANIMATED ACTIVE PURPLE BORDER BOTTOM LINE (#820f4c) */}
      <span
        className="dc-nav-indicator"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
        }}
      />
    </div>
  );
});

export default NavigationRow;
