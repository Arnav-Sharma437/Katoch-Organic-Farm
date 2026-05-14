"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successDetail, setSuccessDetail] = useState<"emailed" | "savedOnly">("emailed");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const firstName = String(fd.get("firstName") ?? "").trim();
    const lastName = String(fd.get("lastName") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage((data as { error?: string }).error ?? "Something went wrong. Please try again.");
        return;
      }
      const skipped = Boolean((data as { emailSkipped?: boolean }).emailSkipped);
      setSuccessDetail(skipped ? "savedOnly" : "emailed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="contact-form fade-up">
      {status === "success" ? (
        <p className="mb-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-[var(--primary-color)]">
          {successDetail === "emailed" ? (
            <>Your message has been sent! We&apos;ll get back to you soon.</>
          ) : (
            <>
              Your message was received and we&apos;ll reply soon. If you need us right away, email{" "}
              <a href="mailto:katochorganic0024@gmail.com" className="underline">
                katochorganic0024@gmail.com
              </a>
              .
            </>
          )}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{errorMessage}</p>
      ) : null}
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" required disabled={status === "sending"} />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" required disabled={status === "sending"} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required disabled={status === "sending"} />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" rows={5} required disabled={status === "sending"} />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send Message"}
        </button>
      </form>
    </div>
  );
}
