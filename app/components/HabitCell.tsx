import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import NoteSheet from "./NoteSheet";

interface Props {
  habitId: string;
  date: string;
  done: boolean;
  note: string | undefined;
  isToday: boolean;
}

export default function HabitCell({ habitId, date, done, note, isToday }: Props) {
  const toggle = useMutation(api.entries.toggle);
  const [showNote, setShowNote] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressed = useRef(false);

  function onPointerDown() {
    longPressed.current = false;
    timerRef.current = setTimeout(() => {
      longPressed.current = true;
      setShowNote(true);
    }, 500);
  }

  function onPointerUp() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }

  function onClick() {
    if (longPressed.current) return;
    toggle({ habitId: habitId as Id<"habits">, date });
  }

  const bg = done
    ? "bg-[#22c55e]"
    : isToday
    ? "border border-dashed border-[#555] bg-transparent"
    : "bg-[#1a1a1a]";

  return (
    <>
      <button
        className={`w-full max-h-[2rem] aspect-square rounded-sm flex items-center justify-center relative transition-transform duration-75 active:scale-90 ${bg}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onClick}
        aria-label={`${done ? "Done" : "Not done"} for ${date}`}
      >
        {note && done && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white/60 rounded-full" />
        )}
      </button>
      {showNote && (
        <NoteSheet
          habitId={habitId}
          date={date}
          existingNote={note ?? ""}
          onClose={() => setShowNote(false)}
        />
      )}
    </>
  );
}
