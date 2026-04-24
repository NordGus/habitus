import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/tracker" as const, label: "Tracker" },
  { to: "/habits" as const, label: "Habits" },
  { to: "/stats" as const, label: "Stats" },
];

const baseClass =
  "flex-1 py-1.5 text-sm font-medium rounded-full transition-colors duration-150 text-center";

export default function PillNav() {
  return (
    <div className="flex bg-[#1a1a1a] rounded-full p-1 mx-4 my-3">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`${baseClass} text-[#666] hover:text-white`}
          activeProps={{ className: "bg-white text-black" }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
