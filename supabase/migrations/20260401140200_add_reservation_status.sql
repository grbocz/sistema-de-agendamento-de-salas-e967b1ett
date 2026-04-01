DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='reservations' AND column_name='status'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN status text NOT NULL DEFAULT 'pendente';
    UPDATE public.reservations SET status = 'aprovada';
  END IF;
END $$;
