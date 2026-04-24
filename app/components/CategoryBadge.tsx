interface Props {
  name: string;
  color: string;
}

export default function CategoryBadge({ name, color }: Props) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {name}
    </span>
  );
}
