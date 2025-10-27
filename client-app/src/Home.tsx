import { GET } from "./services/http";

export default function Home() {
  async function getMoreData() {
    const data = await GET("/api/data");
    console.log(data);
  }

  return (
    <div className="flex-1 items-center justify-center">
      <div className="">Authenticated</div>
      <button className="bg-blue-600 text-white p-4" onClick={getMoreData}>
        Make More Calls
      </button>
    </div>
  );
}
