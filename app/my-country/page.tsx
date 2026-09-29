import NewsDeskPage from "../../components/NewsDeskPage";
import { DEFAULT_COUNTRY_CODE } from "../../lib/news/classify";

export const revalidate = 60;

export default function MyCountryPage() {
  return (
    <NewsDeskPage
      pageKey="my-country"
      query={{ countryCode: DEFAULT_COUNTRY_CODE }}
      emptyTitle="No local stories available yet."
      emptySummary="Nigeria desk coverage appears here when a published story is attributed to NG."
    />
  );
}
