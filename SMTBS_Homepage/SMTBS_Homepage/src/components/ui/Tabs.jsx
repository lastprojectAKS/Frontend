import { useState } from "react";

export default function Tabs({ tabs, defaultValue }) {
  const [active, setActive] = useState(defaultValue || tabs[0]?.value);
  const activeTab = tabs.find((tab) => tab.value === active);

  return (
    <div>
      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active === tab.value}
            onClick={() => setActive(tab.value)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active === tab.value
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{activeTab?.content}</div>
    </div>
  );
}
