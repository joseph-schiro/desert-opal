import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/shop", "/about", "/faq", "/shipping", "/contact"];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productEntries = products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // If the catalog can't be reached at build/request time, ship the static map.
  }

  return [...staticEntries, ...productEntries];
}
