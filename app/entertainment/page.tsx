import NewsDeskPage from "../../components/NewsDeskPage";
import EntertainmentFilters from "../../components/EntertainmentFilters";

export const revalidate = 60;

export default async function EntertainmentPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const selectedScope = scope === "global" || scope === "local" ? scope : "";
  const subCategory = selectedScope === "global" ? "hollywood" : selectedScope === "local" ? "nollywood" : undefined;

  return (
    <NewsDeskPage
      pageKey="entertainment"
      query={{ mainCategory: "entertainment", ...(subCategory ? { subCategory } : {}) }}
    >
      <EntertainmentFilters selectedScope={selectedScope} />
    </NewsDeskPage>
  );
}
