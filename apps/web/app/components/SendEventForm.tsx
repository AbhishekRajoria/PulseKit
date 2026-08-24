import { useState, type SubmitEvent, type ChangeEvent } from "react";
import { submitForm } from "../actions/events";

export type EventForm = {
  eventName: string;
  userId: string;
  payload: string;
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function SendEventForm() {
  const [form, setForm] = useState<EventForm>({
    eventName: "",
    userId: "",
    payload: "",
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    // mock submit — no real POST endpoint yet
    const result = await submitForm(new FormData(e.target));

    if (result.success) {
      setStatus("success");
      setForm({ eventName: "", userId: "", payload: "" });
    } else {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:{" "}
        <input
          type="text"
          id="eventName"
          name="eventName"
          value={form.eventName}
          onChange={handleInput}
        />
      </label>
      <label>
        User Id:{" "}
        <input
          type="text"
          id="userId"
          name="userId"
          value={form.userId}
          onChange={handleInput}
        />
      </label>
      <label>
        Payload:{" "}
        <textarea
          id="payload"
          name="payload"
          value={form.payload}
          onChange={handleInput}
        />
      </label>
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send Event"}
      </button>
    </form>
  );
}
