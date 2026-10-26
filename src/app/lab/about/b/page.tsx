import { getEditor } from "@/lib/editor";
import { MockB } from "../mockups";

export default async function Page() {
  return <MockB e={await getEditor()} />;
}
