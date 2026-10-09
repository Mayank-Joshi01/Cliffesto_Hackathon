import { notFound } from "next/navigation";
import { ProductBrowser } from "@/features/products/ProductBrowser";
import { getCategory } from "@/lib/catalog";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <ProductBrowser
        initialCategorySlug={category.level > 1 ? undefined : category.slug}
        initialSubcategory={category.level > 1 ? category.name : undefined}
        categoryTitle={category.name}
      />
    </main>
  );
}
