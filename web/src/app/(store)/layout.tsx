import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Layout for the customer-facing storefront. The (store) folder is a route
// group — it organizes files without adding a URL segment, so pages here still
// live at "/", "/shop", etc. The admin section has its own separate layout.
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
