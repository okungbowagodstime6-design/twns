import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function SportsPage() {
  return <NewsDeskPage pageKey="sports" query={{ categorySlug: "sports" }} />;
}
