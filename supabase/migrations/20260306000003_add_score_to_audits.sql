-- Add score column to audits for compliance scoring
ALTER TABLE audits
ADD COLUMN score numeric DEFAULT NULL;

-- Create index for filtering by score
CREATE INDEX idx_audits_score ON audits(score);
