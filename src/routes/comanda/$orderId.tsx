import { createFileRoute } from "@tanstack/react-router";
import { CustomerBillView } from "@/components/keepserv/customer-bill-view";

export const Route = createFileRoute("/comanda/$orderId")({
  head: () => ({
    meta: [
      { title: "Comanda Digital | Keep Serv" },
      {
        name: "description",
        content:
          "Consulte sua comanda em tempo real, acompanhe o preparo dos itens e pague via Pix.",
      },
      { property: "og:title", content: "Comanda Digital | Keep Serv" },
      {
        property: "og:description",
        content: "Acompanhe o consumo da sua mesa em tempo real pelo celular.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ComandaPage,
});

function ComandaPage() {
  const { orderId } = Route.useParams();
  return <CustomerBillView orderId={orderId} />;
}
