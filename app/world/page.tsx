import NewsDeskPage from "../../components/NewsDeskPage";

export const revalidate = 60;

export default function WorldPage() {
  return <NewsDeskPage pageKey="world" />;
}
