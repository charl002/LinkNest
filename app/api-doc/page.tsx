import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();

  return (
    <div className="min-h-screen overflow-y-auto bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <ReactSwagger spec={spec} />
      </div>
    </div>
  );
}
