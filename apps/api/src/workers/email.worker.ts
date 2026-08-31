import { Worker } from "bullmq";
import { Resend } from "resend";
import { Redis } from "ioredis";
import { pool } from "../db.ts";
import { Queue } from "bullmq";

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = new Redis({ maxRetriesPerRequest: null });

const dlq = new Queue("email-dlq", { connection });

const worker = new Worker(
  "email",
  async (job) => {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: job.data.to,
      subject: `New event: ${job.data.event_name}`,
      html: `<p>${job.data.event_name} for user ${job.data.user_id}</p>`,
    });

    if (error) {
      throw new Error(`Resend failed: ${error.message}`);
    }

    await pool.query(
      `INSERT INTO delivery_logs (event_id, project_id, channel, status)
       VALUES ($1, $2, $3, $4)`,
      [job.data.event_id, job.data.project_id, "email", "delivered"],
    );

    console.log(
      `✅ email sent: "${job.data.event_name}" → ${job.data.to} (job ${job.id}, delivery_log recorded)`,
    );
  },
  { connection },
);

worker.on("failed", async (job, err) => {
  if (!job) return;

  // 1) ALWAYS log this failed attempt (real attempts 1-5)
  await pool.query(
    `INSERT INTO delivery_logs (event_id, project_id, channel, status, attempt_number, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      job.data.event_id,
      job.data.project_id,
      "email",
      "failed",
      job.attemptsMade,
      err.message,
    ],
  );

  // 2) On exhaustion only: DLQ + sentinel
  if ((job.attemptsMade ?? 0) >= (job.opts.attempts ?? 0)) {
    await dlq.add("email", job.data);
    await pool.query(
      `INSERT INTO delivery_logs (..., attempt_number, ...) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        job.data.event_id,
        job.data.project_id,
        "email",
        "failed",
        job.attemptsMade + 1,
        err.message,
      ],
    );
  }
});
