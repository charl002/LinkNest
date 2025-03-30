import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();

  return (
    <div className="min-h-screen overflow-auto">
      <ReactSwagger spec={spec} />
    </div>
  );
}
