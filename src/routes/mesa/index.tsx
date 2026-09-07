import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mesa/")({
  beforeLoad: () => {
    throw redirect({ to: "/cliente" });
  },
});
