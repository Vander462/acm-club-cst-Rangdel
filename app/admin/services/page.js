import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listServices } from "@/lib/db";
import AdminServices from "@/components/AdminServices";

export const dynamic = "force-dynamic";
export const metadata = { title: "CST Zhabto Admin - Services" };

export default async function AdminServicesPage() {
  if (!isAdmin()) redirect("/admin/login");
  const initial = await listServices();
  return <AdminServices initial={initial} />;
}
