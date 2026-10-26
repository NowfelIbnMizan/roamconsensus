import { getEditor } from "@/lib/editor";
import { MockC } from "../mockups";

export default async function Page() {
  return <MockC e={await getEditor()} />;
}
