import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/comanda/")({
  beforeLoad: () => {
    throw redirect({ to: "/cliente" });
  },
});
