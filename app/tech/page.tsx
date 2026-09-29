import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function TechPage() {
  return <NewsDeskPage pageKey="tech" query={{ categorySlug: "technology" }} />;
}
