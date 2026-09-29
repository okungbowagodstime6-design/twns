import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function BreakingPage() {
  return (
    <NewsDeskPage
      pageKey="breaking"
      query={{ articleTypes: ["BREAKING", "DEVELOPING"] }}
      emptyTitle="No breaking stories available."
      emptySummary="Developing coverage appears here only after it is reviewed and published."
    />
  );
}
