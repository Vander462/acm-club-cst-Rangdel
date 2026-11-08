import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listProviders } from "@/lib/db";
import AdminProviders from "@/components/AdminProviders";

export const dynamic = "force-dynamic";
export const metadata = { title: "CST Zhabto Admin - Providers" };

export default async function AdminProvidersPage() {
  if (!isAdmin()) redirect("/admin/login");
  const initial = await listProviders();
  return <AdminProviders initial={initial} />;
}
