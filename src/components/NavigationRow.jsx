import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const TABS = [
  {
    id: 'datatables',
    type: 'single',
    title: 'DataTables',
    optionId: 'datatables',
  },
  {
    id: 'entities_forms',
    type: 'dropdown',
    title: 'Entities & Forms',
    items: [
      { id: 'task_entity', label: 'Task Entity' },
      { id: 'subtask_master', label: 'SubTask Master' },
      { id: 'custom_form', label: 'Custom Form' },
    ]
  },
  {
    id: 'configurations',
    type: 'dropdown',
    title: 'Configurations',
    items: [
      { id: 'master_config', label: 'Master Config' },
      { id: 'site_config', label: 'Site Config' },
      { id: 'dropdown_config', label: 'Dropdown Config' },
      { id: 'permission_config', label: 'Permission Config' },
      { id: 'workflow_config', label: 'WorkFlow Config' },
    ]
  },
  {
    id: 'system_roles',
    type: 'dropdown',
    title: 'System & Roles',
    items: [
      { id: 'attachment_tag_list', label: 'Attachment Tag List' },
      { id: 'role_department_list', label: 'Role Department List' },
      { id: 'drupal_roles', label: 'Drupal Roles' },
      { id: 'react_menus', label: 'React Menus' },
      { id: 'templates', label: 'Templates' },
    ]
  }
];

const getActiveTabId = (activeOption) => {
  if (activeOption === 'datatables') return 'datatables';
  for (const tab of TABS) {
    if (tab.type === 'dropdown' && tab.items.some(item => item.id === activeOption)) {
      return tab.id;
    }
  }
  return 'datatables';
};

const NavigationRow = ({ activeOption, onSelectOption }) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const tabRefs = useRef({});
  const navContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const activeTabId = getActiveTabId(activeOption);

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
  }, [activeOption, activeTabId]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    const animId = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 100);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, [activeOption, activeTabId]);

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

  const handleTabClick = (tab) => {
    if (tab.type === 'single') {
      onSelectOption(tab.optionId, tab.title);
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(prev => (prev === tab.id ? null : tab.id));
    }
  };

  const handleSelectItem = (item) => {
    onSelectOption(item.id, item.label);
    setOpenDropdownId(null);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-xs relative z-30" ref={navContainerRef}>
      <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">

        {/* Navigation Tabs List */}
        <div className="flex items-center space-x-6 sm:space-x-10">
          {TABS.map((tab) => {
            const isTabActive = activeTabId === tab.id;
            const isOpen = openDropdownId === tab.id;

            if (tab.type === 'single') {
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => handleTabClick(tab)}
                  className={`py-3.5 text-[13px] font-semibold transition-colors duration-200 cursor-pointer outline-none ${
                    isTabActive
                      ? 'text-[#820f4c]'
                      : 'text-gray-700 hover:text-[#820f4c]'
                  }`}
                >
                  {tab.title}
                </button>
              );
            }

            return (
              <div key={tab.id} className="relative flex items-center">
                <button
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => handleTabClick(tab)}
                  className={`py-3.5 text-[13px] font-semibold flex items-center space-x-1.5 transition-colors duration-200 cursor-pointer outline-none ${
                    isTabActive
                      ? 'text-[#820f4c]'
                      : 'text-gray-700 hover:text-[#820f4c]'
                  }`}
                >
                  <span>{tab.title}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-[#820f4c]' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* DROPDOWN MENU CARD */}
                {isOpen && (
                  <div className="absolute left-0 top-full mt-0 w-60 bg-white border border-gray-100 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                    {tab.items.map((item) => {
                      const isOptionSelected = activeOption === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`w-full text-left px-5 py-2.5 text-[13px] transition-colors duration-150 cursor-pointer ${
                            isOptionSelected
                              ? 'bg-[#820f4c] text-white font-medium'
                              : 'text-gray-700 hover:bg-[#820f4c] hover:text-white font-medium'
                          }`}
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
        className="absolute bottom-0 h-[3px] bg-[#820f4c] transition-all duration-300 ease-out pointer-events-none z-10 rounded-t-xs"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
        }}
      />
    </div>
  );
};

export default NavigationRow;
