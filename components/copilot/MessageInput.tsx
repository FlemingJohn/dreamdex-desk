"use client";

import { useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

/** Where the trader types. Submits on enter, clears once handed off. */
export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim().length === 0 || disabled) {
      return;
    }
    onSend(draft);
    setDraft("");
  }

  return (
    <form className="copilot-composer" onSubmit={handleSubmit}>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Ask what is worth trading..."
        disabled={disabled}
        aria-label="Message the copilot"
      />
      <Button type="submit" size="icon" disabled={disabled || draft.trim().length === 0}>
        <SendHorizontal className="size-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
