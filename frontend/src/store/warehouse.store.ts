import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WarehouseStoreState {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string | null) => void;
}

export const useWarehouseStore = create<WarehouseStoreState>()(
  persist(
    (set) => ({
      selectedWarehouseId: null,
      setSelectedWarehouseId: (id: string | null) => set({ selectedWarehouseId: id }),
    }),
    {
      name: "wms-active-warehouse",
    }
  )
);
