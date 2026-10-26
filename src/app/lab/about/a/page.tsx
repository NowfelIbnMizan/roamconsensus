import { getEditor } from "@/lib/editor";
import { MockA } from "../mockups";

export default async function Page() {
  return <MockA e={await getEditor()} />;
}
