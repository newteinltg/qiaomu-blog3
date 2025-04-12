import { AdminLayout } from "@/components/admin/layout";
import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "博客管理后台 - 向阳乔木的个人博客",
  description: "博客管理后台",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <AdminLayout>{children}</AdminLayout>
    </SessionProvider>
  );
}
