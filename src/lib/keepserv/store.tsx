/**
 * Adaptador de Compatibilidade / Fachada de Transição (Fase 3)
 *
 * Reexporta o estado modularizado de `@/state` e tipos de `@/domain`
 * para garantir compatibilidade retroativa com código legado.
 */

import { RootStateProvider, useKeepServ as useKeepServModular } from "../../state";
import type { ReactNode } from "react";

export {
  RootStateProvider,
  useKeepServ,
  useAuth,
  useOrders,
  useBilling,
  useMenu,
  useStock,
  useCustomers,
} from "../../state";

export type {
  NewLojaInput,
  NewGestorInput,
  NewDonoInput,
  NewUserInput,
  Session,
} from "../../domain/team/types";

export type { NewOrderInput } from "../../domain/orders/types";
export type { NewCashFlowInput } from "../../domain/billing/types";

export function KeepServProvider({ children }: { children: ReactNode }) {
  return <RootStateProvider>{children}</RootStateProvider>;
}

export const LegacyKeepServProvider = KeepServProvider;
