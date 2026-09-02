import { Worker } from "bullmq";
import { Resend } from "resend";
import { Redis } from "ioredis";
import { pool } from "../db.ts";
import { Queue } from "bullmq";
import { redis } from "../lib/redis.ts";

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = redis;

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

    redis.publish(
      "delivery_updates",
      JSON.stringify({
        type: "delivery_update",
        data: {
          eventId: job.data.event_id,
          projectId: job.data.project_id,
          channel: "email",
          status: "delivered",
          deliveredAt: new Date().toISOString(),
        },
      }),
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

  redis.publish(
    "delivery_updates",
    JSON.stringify({
      type: "delivery_update",
      data: {
        eventId: job.data.event_id,
        projectId: job.data.project_id,
        channel: "email",
        status: "failed",
        deliveredAt: new Date().toISOString(),
      },
    }),
  );

  // 2) On exhaustion only: DLQ + sentinel
  if ((job.attemptsMade ?? 0) >= (job.opts.attempts ?? 0)) {
    await dlq.add("email", job.data);
    await pool.query(
      `INSERT INTO delivery_logs (event_id, project_id, channel, status, attempt_number, error_message) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        job.data.event_id,
        job.data.project_id,
        "email",
        "failed",
        job.attemptsMade + 1,
        err.message,
      ],
    );

    redis.publish(
      "delivery_updates",
      JSON.stringify({
        type: "delivery_update",
        data: {
          eventId: job.data.event_id,
          projectId: job.data.project_id,
          channel: "email",
          status: "sentinel",
          deliveredAt: new Date().toISOString(),
        },
      }),
    );
  }
});
