import { useMemo, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth-store";
import { OrdersProvider, useOrders } from "./orders-store";
import { BillingProvider, useBilling } from "./billing-store";
import { MenuProvider, useMenu } from "./menu-store";
import { StockProvider, useStock } from "./stock-store";
import { CustomersProvider, useCustomers } from "./customers-store";

export * from "./auth-store";
export * from "./orders-store";
export * from "./billing-store";
export * from "./menu-store";
export * from "./stock-store";
export * from "./customers-store";

/**
 * Provedor raiz composto que encapsula todos os sub-stores especializados mantendo a hierarquia.
 */
export function RootStateProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OrdersProvider>
        <BillingProvider>
          <MenuProvider>
            <StockProvider>
              <CustomersProvider>{children}</CustomersProvider>
            </StockProvider>
          </MenuProvider>
        </BillingProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}

/**
 * Hook de Fachada (Facade Pattern) que unifica todos os slices de estado do sistema,
 * garantindo retrocompatibilidade imediata com qualquer componente existente que utilize `useKeepServ()`.
 */
export function useKeepServ() {
  const auth = useAuth();
  const orders = useOrders();
  const billing = useBilling();
  const menu = useMenu();
  const stock = useStock();
  const customers = useCustomers();

  return useMemo(
    () => ({
      ...auth,
      ...orders,
      ...billing,
      ...menu,
      ...stock,
      ...customers,
    }),
    [auth, orders, billing, menu, stock, customers],
  );
}
