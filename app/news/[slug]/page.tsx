import { redirect } from "next/navigation";

export default function NewsArticleRedirect({ params }: { params: { slug: string } }) {
  redirect(`/article/${params.slug}`);
}
