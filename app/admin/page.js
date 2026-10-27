import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listAll } from "@/lib/db";
import AdminSheet from "@/components/AdminSheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "CST Zhabto Admin" };

export default function AdminPage() {
  if (!isAdmin()) redirect("/admin/login");
  return <AdminSheet initial={listAll()} />;
}
