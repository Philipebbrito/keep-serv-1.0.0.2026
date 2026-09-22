import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem, NewProductInput } from "../domain/menu/types";
import { MENU } from "../data/mock/menu.mock";
import { useAuth } from "./auth-store";

const STORAGE_PRODUCTS = "keepserv_products_v4";

export interface MenuContextType {
  products: MenuItem[];
  allProducts: MenuItem[];
  addProduct: (input: NewProductInput) => MenuItem;
  updateProduct: (id: string, data: Partial<Omit<MenuItem, "id">>) => void;
  deleteProduct: (id: string) => { success: boolean; message?: string };
  adjustStock: (id: string, deltaOrExact: number, mode?: "delta" | "set") => void;
  toggleProductActive: (id: string) => void;
  resetProductsToDefault: () => void;
}

const MenuContext = createContext<MenuContextType | null>(null);

let productCounter = 0;
const uid = (p: string) => `${p}-prod-${++productCounter}`;

export function MenuProvider({ children }: { children: ReactNode }) {
  const { session, activeLoja } = useAuth();

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  const [products, setProducts] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return MENU;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
    } catch {
      // Ignora erro de localStorage
    }
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return products;
    }
    const target = currentLojaId || "loja-1";
    return products.filter((p) => (p.loja_id ? p.loja_id === target : true));
  }, [products, session, currentLojaId]);

  const addProduct = useCallback(
    (input: NewProductInput): MenuItem => {
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const newProd: MenuItem = {
        id: uid("prod"),
        loja_id: targetLojaId,
        name: input.name.trim(),
        price: input.price,
        category: input.category,
        description: input.description?.trim(),
        image: input.image,
        highlight: input.highlight,
        serves: input.serves?.trim(),
        active: input.active,
        stockConsumption: input.stockConsumption,
        linkedStockItemId: input.linkedStockItemId,
        directStockQty: input.directStockQty,
        recipeIngredients: input.recipeIngredients,
        stock: input.stock ?? 20,
        minStock: input.minStock ?? 5,
        trackStock: input.trackStock ?? true,
        unit: input.unit ?? "un",
        updatedAt: Date.now(),
      };

      setProducts((prev) => [newProd, ...prev]);
      return newProd;
    },
    [currentLojaId],
  );

  const updateProduct = useCallback((id: string, data: Partial<Omit<MenuItem, "id">>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)),
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true, message: "Produto excluído com sucesso." };
  }, []);

  const adjustStock = useCallback(
    (id: string, deltaOrExact: number, mode: "delta" | "set" = "delta") => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const current = p.stock ?? 0;
          const updated =
            mode === "set" ? Math.max(0, deltaOrExact) : Math.max(0, current + deltaOrExact);
          return { ...p, stock: updated, updatedAt: Date.now() };
        }),
      );
    },
    [],
  );

  const toggleProductActive = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active, updatedAt: Date.now() } : p)),
    );
  }, []);

  const resetProductsToDefault = useCallback(() => {
    setProducts(MENU);
    try {
      localStorage.removeItem(STORAGE_PRODUCTS);
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const value = useMemo(
    () => ({
      products: visibleProducts,
      allProducts: products,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      toggleProductActive,
      resetProductsToDefault,
    }),
    [
      visibleProducts,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      toggleProductActive,
      resetProductsToDefault,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenu deve ser usado dentro de um MenuProvider");
  }
  return ctx;
}
