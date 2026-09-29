import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function EntertainmentPage() {
  return <NewsDeskPage pageKey="entertainment" query={{ categorySlug: "entertainment" }} />;
}
