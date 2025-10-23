-- Add deleted_at column to all_jobs table for soft delete functionality
-- This allows jobs to be "deleted" but kept for 30 days before permanent removal

-- Add the deleted_at column
ALTER TABLE "public"."all_jobs"
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index on deleted_at for better query performance
CREATE INDEX idx_all_jobs_deleted_at ON "public"."all_jobs" (deleted_at);

-- Add a comment to explain the column purpose
COMMENT ON COLUMN "public"."all_jobs".deleted_at IS 'Timestamp when the job was soft deleted. NULL means not deleted.';

-- Verify the column was added
SELECT "Count", "Client Name", "Status", deleted_at FROM "public"."all_jobs" LIMIT 5;
