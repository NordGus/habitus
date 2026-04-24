import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props {
  habitId: string;
  date: string;
  existingNote: string;
  onClose: () => void;
}

export default function NoteSheet({ habitId, date, existingNote, onClose }: Props) {
  const [note, setNote] = useState(existingNote);
  const saveNote = useMutation(api.entries.setNote);

  async function save() {
    await saveNote({ habitId: habitId as Id<"habits">, date, note });
    onClose();
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close note sheet"
      />
      {/* Bottom sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto">
        <div className="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold text-white mb-3">Add a note</p>
        <textarea
          className="w-full bg-[#111] text-white text-sm rounded-xl p-3 resize-none border border-[#333] focus:outline-none focus:border-[#555] h-24"
          placeholder="How did it go?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
            onClick={save}
          >
            Save
          </button>
          <button
            className="px-4 py-2.5 rounded-xl bg-[#333] text-[#aaa] text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
