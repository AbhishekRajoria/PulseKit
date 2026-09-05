import { Queue, Worker } from "bullmq";
import { Resend } from "resend";
import { pool } from "../db.ts";
import { redis } from "../lib/redis.ts";

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = redis;

const dlq = new Queue("email-dlq", { connection });

const worker = new Worker(
  "email",
  async (job) => {
    // load the project's enabled channels config
    const result = await pool.query(
      `SELECT channels FROM projects where id=$1`,
      [job.data.project_id],
    );

    const channels = result.rows[0]?.channels ?? {};

    if (channels.email) {
      try {
        // send email via Resend
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
      } catch (err) {
        const message = (err as Error).message;
        await pool.query(
          `INSERT INTO delivery_logs (event_id, project_id, channel, status, attempt_number, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            job.data.event_id,
            job.data.project_id,
            "email",
            "failed",
            1,
            message,
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
      }
    }

    if (channels.inapp) {
      try {
        // insert notification row for in-app inbox
        await pool.query(
          `INSERT INTO notifications ( project_id, user_id, title, body )
        VALUES ($1, $2, $3, $4)`,
          [
            job.data.project_id,
            job.data.user_id,
            `New event: ${job.data.event_name}`,
            `${job.data.event_name} for user ${job.data.user_id}`,
          ],
        );

        // log the inapp delivery
        await pool.query(
          `INSERT INTO delivery_logs (event_id, project_id, channel, status)
       VALUES ($1, $2, $3, $4)`,
          [job.data.event_id, job.data.project_id, "inapp", "delivered"],
        );

        // broadcast to live feed
        redis.publish(
          "delivery_updates",
          JSON.stringify({
            type: "delivery_update",
            data: {
              eventId: job.data.event_id,
              projectId: job.data.project_id,
              channel: "inapp",
              status: "delivered",
              deliveredAt: new Date().toISOString(),
            },
          }),
        );
      } catch (err) {
        const message = (err as Error).message;
        await pool.query(
          `INSERT INTO delivery_logs (event_id, project_id, channel, status, attempt_number, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            job.data.event_id,
            job.data.project_id,
            "inapp",
            "failed",
            1,
            message,
          ],
        );
        redis.publish(
          "delivery_updates",
          JSON.stringify({
            type: "delivery_update",
            data: {
              eventId: job.data.event_id,
              projectId: job.data.project_id,
              channel: "inapp",
              status: "failed",
              deliveredAt: new Date().toISOString(),
            },
          }),
        );
      }
    }
  },
  { connection },
);

// fires ONLY on catastrophic failures (config read / DB down) —
// channel-level failures are caught per-channel in the processor
worker.on("failed", async (job, err) => {
  if (!job) return;

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
