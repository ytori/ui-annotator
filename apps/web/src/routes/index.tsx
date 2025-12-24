import { createFileRoute } from "@tanstack/react-router";
import { RootPage } from "@/app/pages/home";

export const Route = createFileRoute("/")({
  component: RootPage,
});
