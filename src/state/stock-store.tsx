import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NewStockItemInput, StockItem, StockMovement } from "../domain/stock/types";
import { INITIAL_STOCK_ITEMS } from "../data/mock/stock.mock";
import { useAuth } from "./auth-store";

const STORAGE_STOCK = "keepserv_stock_v4";

export interface StockContextType {
  stockItems: StockItem[];
  allStockItems: StockItem[];
  addStockItem: (input: NewStockItemInput) => StockItem;
  updateStockItem: (id: string, data: Partial<Omit<StockItem, "id">>) => void;
  deleteStockItem: (id: string) => { success: boolean; message?: string };
  adjustStockItem: (
    id: string,
    deltaQty: number,
    reason: string,
    type?: "entrada" | "saida" | "ajuste",
  ) => void;
  resetStockToDefault: () => void;
}

const StockContext = createContext<StockContextType | null>(null);

let stockCounter = 0;
const uid = (p: string) => `${p}-stk-${++stockCounter}`;

export function StockProvider({ children }: { children: ReactNode }) {
  const { session, activeLoja } = useAuth();

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STOCK);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STOCK_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STOCK, JSON.stringify(stockItems));
    } catch {
      // Ignora erro de localStorage
    }
  }, [stockItems]);

  const visibleStock = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return stockItems;
    }
    const target = currentLojaId || "loja-1";
    return stockItems.filter((s) => (s.loja_id ? s.loja_id === target : true));
  }, [stockItems, session, currentLojaId]);

  const addStockItem = useCallback(
    (input: NewStockItemInput): StockItem => {
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const nowTs = Date.now();
      const initialMovement: StockMovement = {
        id: uid("mov"),
        type: "entrada",
        quantity: input.currentStock,
        previousStock: 0,
        newStock: input.currentStock,
        reason: "Saldo Inicial de Cadastro",
        timestamp: nowTs,
        author: session?.nome || session?.name || "Operador",
      };

      const newItem: StockItem = {
        id: uid("item"),
        loja_id: targetLojaId,
        name: input.name.trim(),
        type: input.type,
        currentStock: input.currentStock,
        minStock: input.minStock,
        unit: input.unit.trim(),
        costPrice: input.costPrice,
        supplier: input.supplier?.trim(),
        notes: input.notes?.trim(),
        movements: [initialMovement],
        updatedAt: nowTs,
      };

      setStockItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [session, currentLojaId],
  );

  const updateStockItem = useCallback((id: string, data: Partial<Omit<StockItem, "id">>) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: Date.now() } : s)),
    );
  }, []);

  const deleteStockItem = useCallback((id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
    return { success: true, message: "Item excluído do estoque com sucesso." };
  }, []);

  const adjustStockItem = useCallback(
    (
      id: string,
      deltaQty: number,
      reason: string,
      type: "entrada" | "saida" | "ajuste" = "ajuste",
    ) => {
      setStockItems((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;

          const prevStock = s.currentStock;
          let newStock = prevStock;

          if (type === "entrada") {
            newStock = Math.max(0, prevStock + deltaQty);
          } else if (type === "saida") {
            newStock = Math.max(0, prevStock - Math.abs(deltaQty));
          } else {
            // ajuste exato ou delta
            newStock = Math.max(0, prevStock + deltaQty);
          }

          const movement: StockMovement = {
            id: uid("mov"),
            type,
            quantity: Math.abs(deltaQty),
            previousStock: prevStock,
            newStock,
            reason: reason.trim() || "Ajuste manual",
            timestamp: Date.now(),
            author: session?.nome || session?.name || "Operador",
          };

          return {
            ...s,
            currentStock: newStock,
            movements: [movement, ...s.movements],
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [session],
  );

  const resetStockToDefault = useCallback(() => {
    setStockItems(INITIAL_STOCK_ITEMS);
    try {
      localStorage.removeItem(STORAGE_STOCK);
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const value = useMemo(
    () => ({
      stockItems: visibleStock,
      allStockItems: stockItems,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      adjustStockItem,
      resetStockToDefault,
    }),
    [
      visibleStock,
      stockItems,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      adjustStockItem,
      resetStockToDefault,
    ],
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    throw new Error("useStock deve ser usado dentro de um StockProvider");
  }
  return ctx;
}
