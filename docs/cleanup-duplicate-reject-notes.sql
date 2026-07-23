-- Optional cleanup: clear legacy notes that duplicated comment (false rejection reasons)
-- Paste in Supabase SQL Editor if old Rejected rows show same text in both columns

UPDATE public.transactions
SET note = NULL
WHERE status = 'FAILED'
  AND note IS NOT NULL
  AND comment IS NOT NULL
  AND trim(note) = trim(comment);
