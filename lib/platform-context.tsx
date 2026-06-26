"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface PlatformContextValue {
  chatOpen: boolean;
  toggleChat: () => void;
  closeChat: () => void;
  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
}

const PlatformContext = createContext<PlatformContextValue>({
  chatOpen: false,
  toggleChat: () => {},
  closeChat: () => {},
  commandOpen: false,
  openCommand: () => {},
  closeCommand: () => {},
  toggleCommand: () => {},
});

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);
  const toggleCommand = useCallback(() => setCommandOpen((v) => !v), []);

  return (
    <PlatformContext.Provider
      value={{
        chatOpen,
        toggleChat,
        closeChat,
        commandOpen,
        openCommand,
        closeCommand,
        toggleCommand,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
