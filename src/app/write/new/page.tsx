import { redirect } from "next/navigation";
import { currentWriter } from "@/lib/writer/auth";
import { WriterPostForm } from "../post-form";

export default async function NewPost() {
  if (!(await currentWriter())) redirect("/write");
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
      <WriterPostForm />
    </>
  );
}
