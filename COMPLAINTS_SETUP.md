# Complaints and Support setup

The complaint flow uses the existing PostgreSQL database and Resend email integration.

Required backend environment variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `RESEND_API_KEY`: authenticated Resend API key. Keep this server-side only.
- `RESEND_FROM_EMAIL`: verified sender, for example `Elevata Support <support@your-verified-domain>`. If omitted, the existing Resend utility fallback is used.

Before deploying the complaint schema, run from `backend/` after the database is reachable:

```powershell
npm run prisma:migrate
npm run prisma:generate
```

For a first-time database or a deployment workflow that does not create migrations interactively, use the project-approved Prisma migration process with the production `DATABASE_URL`. Do not run schema changes against production without a database backup and review.

The endpoint is `POST /api/complaints` and requires an authenticated Elevata user. It accepts `multipart/form-data` with one optional PDF, JPG, or PNG evidence file up to 10 MB. Evidence is stored in the restricted `ComplaintEvidence` table and is not included in email attachments.

The endpoint records the complaint before attempting email delivery. If either the internal notification or acknowledgement cannot be sent, the complaint remains stored with a failed delivery status and the API returns an error containing the complaint reference so an administrator can retry or investigate.

Admin management is available at `GET /api/complaints`, `PATCH /api/complaints/:id`, `POST /api/complaints/:id/retry`, and the restricted evidence route. The frontend page is `/complaints`; the admin page is `/admin/complaints`.
