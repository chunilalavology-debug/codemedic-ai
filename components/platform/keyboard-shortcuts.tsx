"use client";

import { useEffect } from "react";
import { usePlatform } from "@/lib/platform-context";

export function KeyboardShortcuts() {
  const { toggleCommand, toggleChat, closeCommand, closeChat } = usePlatform();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        toggleChat();
        return;
      }

      if (e.key === "Escape") {
        closeCommand();
        closeChat();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommand, toggleChat, closeCommand, closeChat]);

  return null;
}
