"use client";

import { createContext, useState, ReactNode } from "react";
import { ItemDrawer } from "./ItemDrawer";

interface ItemDrawerContextType {
  isOpen: boolean;
  itemId: string | null;
  openDrawer: (itemId: string) => void;
  closeDrawer: () => void;
  collections: { id: string; name: string }[];
}

export const ItemDrawerContext = createContext<ItemDrawerContextType | undefined>(
  undefined
);

export function ItemDrawerProvider({ children, collections }: { children: ReactNode; collections: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  const openDrawer = (id: string) => {
    setItemId(id);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    // Delay clearing ID to avoid content flash
    setTimeout(() => setItemId(null), 300);
  };

  return (
    <ItemDrawerContext.Provider value={{ isOpen, itemId, openDrawer, closeDrawer, collections }}>
      {children}
      <ItemDrawer />
    </ItemDrawerContext.Provider>
  );
}