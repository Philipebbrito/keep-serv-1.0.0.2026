import { createFileRoute } from "@tanstack/react-router";
import { CustomerBillView } from "@/components/keepserv/customer-bill-view";

export const Route = createFileRoute("/mesa/$tableId")({
  head: () => ({
    meta: [
      { title: "Mesa do Cliente | Keep Serv" },
      {
        name: "description",
        content: "Cardápio digital, comanda em tempo real e atendimento direto para sua mesa.",
      },
      { property: "og:title", content: "Mesa do Cliente | Keep Serv" },
      {
        property: "og:description",
        content: "Acesse o cardápio digital e acompanhe a comanda da sua mesa.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MesaPage,
});

function MesaPage() {
  const { tableId } = Route.useParams();
  return <CustomerBillView orderId={`mesa-${tableId}`} />;
}
