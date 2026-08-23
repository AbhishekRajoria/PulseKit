import { ApiResponse, Event } from "@/types";
import { notFound } from "next/navigation";

const badgeColors: Record<Event["status"], string> = {
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  rate_limited: "bg-orange-100 text-orange-700",
};

export async function Events({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const res = await fetch(`http://localhost:3000/api/events/${id}`);

  if (!res.ok) {
    notFound();
  }

  const event: ApiResponse<Event> = await res.json();

  const data = event.data;

  if (!event.data) {
    return <div>No Event Found</div>;
  }

  return (
    <main className=" border-2 bg-gray-100 rounded-lg m-10 px-20 pt-10 pb-5">
      <div className="flex justify-between items-center  ">
        <h3 className="flex text-xl  tracking-tight">
          <span>{`Event ${id}`}</span> :{" "}
          <span className="hover:underline">{data?.eventName}</span>
        </h3>
        <span>Created by : {data?.userId} </span>
      </div>
      <hr className="pb-2 pt-2" />
      <div className="flex flex-col font-semibold">
        <div className="text-normal ">
          Project :{" "}
          <span className="text-sm font-normal">{data?.projectId}</span>
        </div>
        <div>
          Status :{" "}
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColors[data!.status]}`}
          >
            {data?.status}
          </span>
        </div>
        <div>
          Channel :{" "}
          <span className="capitalize text-sm font-normal">
            {data?.channel}
          </span>
        </div>
      </div>
      {data?.payload && (
        <div className="pt-5 pb-3">
          <span className="font-bold">Event payload </span>
          <div className="border rounded-sm p-2 ">
            {Object.entries(data.payload).map(([key, value]) => (
              <div key={key}>
                <span className="text-sm font-semibold capitalize">{key}</span>{" "}
                : <span className="text-xs">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-end text-xs">
        {new Date(data!.receivedAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>
    </main>
  );
}

export default Events;
