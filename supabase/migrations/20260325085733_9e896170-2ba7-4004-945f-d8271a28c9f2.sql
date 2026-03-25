
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trading profiles table
CREATE TABLE public.trading_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_deposit NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.trading_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.trading_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.trading_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.trading_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.trading_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trading_profiles_updated_at
  BEFORE UPDATE ON public.trading_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trading entries table
CREATE TABLE public.trading_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profit_amount NUMERIC NOT NULL DEFAULT 0,
  profit_percent NUMERIC NOT NULL DEFAULT 0,
  withdrawal NUMERIC NOT NULL DEFAULT 0,
  starting_balance NUMERIC NOT NULL DEFAULT 0,
  ending_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries" ON public.trading_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.trading_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.trading_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.trading_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trading_entries_updated_at
  BEFORE UPDATE ON public.trading_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trading_entries_user_date ON public.trading_entries (user_id, date);
