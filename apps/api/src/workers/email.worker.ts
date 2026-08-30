import { Worker } from "bullmq";
import { Resend } from "resend";
import { Redis } from "ioredis";
import { pool } from "../db.ts";

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = new Redis({ maxRetriesPerRequest: null });

const worker = new Worker(
  "email",
  async (job) => {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.devc",
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
  },
  { connection },
);
