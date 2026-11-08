import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listAll } from "@/lib/db";
import AdminSheet from "@/components/AdminSheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "CST Zhabto Admin" };

export default async function AdminPage() {
  if (!isAdmin()) redirect("/admin/login");
  const initial = await listAll();
  return <AdminSheet initial={initial} />;
}
