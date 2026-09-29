import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function BusinessPage() {
  return <NewsDeskPage pageKey="business" query={{ categorySlug: "business" }} />;
}
