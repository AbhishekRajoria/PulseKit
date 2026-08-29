"use client";

import { useState } from "react";
import { submitForm } from "../actions/events";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function SendEventForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const result = await submitForm(formData);

    if (result.success) {
      setStatus("success");
      setMessage("Event sent successfully");
      e.currentTarget.reset();
    } else {
      setStatus("error");
      setMessage(result.error || "Failed to send event");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="eventName" className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
          Event Name
        </label>
        <input
          type="text"
          id="eventName"
          name="eventName"
          required
          placeholder="e.g. user.signup"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label htmlFor="userId" className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
          User ID
        </label>
        <input
          type="text"
          id="userId"
          name="userId"
          required
          placeholder="e.g. u123"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label htmlFor="payload" className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
          Payload (JSON)
        </label>
        <textarea
          id="payload"
          name="payload"
          rows={3}
          placeholder='{"key": "value"}'
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "Sending..." : "Send Event"}
      </button>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
