import { redirect } from "next/navigation";

export default async function NewsArticleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/article/${slug}`);
}
