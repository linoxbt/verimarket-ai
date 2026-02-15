
-- Create market categories and statuses
CREATE TYPE public.market_category AS ENUM ('news', 'sports', 'crypto', 'weather');
CREATE TYPE public.market_status AS ENUM ('open', 'resolving', 'disputed', 'finalized');

-- Markets table
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  category market_category NOT NULL,
  status market_status NOT NULL DEFAULT 'open',
  resolution_criteria TEXT NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  yes_probability NUMERIC(5,4) NOT NULL DEFAULT 0.5000,
  api_source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  creator_address TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  volume NUMERIC(18,4) NOT NULL DEFAULT 0
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Markets are publicly readable" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create markets" ON public.markets FOR INSERT TO authenticated WITH CHECK (true);

-- Resolutions table
CREATE TABLE public.resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  confidence NUMERIC(5,4) NOT NULL,
  reasoning_steps JSONB NOT NULL DEFAULT '[]',
  data_hash TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  model_id TEXT NOT NULL,
  evidence_package JSONB,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resolutions are publicly readable" ON public.resolutions FOR SELECT USING (true);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  disputer_address TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  evidence_hash TEXT NOT NULL,
  bond_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disputes are publicly readable" ON public.disputes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (true);

-- Arbitrations table
CREATE TABLE public.arbitrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  confidence NUMERIC(5,4) NOT NULL,
  reasoning_steps JSONB NOT NULL DEFAULT '[]',
  data_hash TEXT NOT NULL,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.arbitrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arbitrations are publicly readable" ON public.arbitrations FOR SELECT USING (true);

-- Trades/positions table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  trader_address TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('YES', 'NO')),
  amount NUMERIC(18,4) NOT NULL,
  estimated_payout NUMERIC(18,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trades are publicly readable" ON public.trades FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (true);

-- Admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin policies for markets
CREATE POLICY "Admins can update markets" ON public.markets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete markets" ON public.markets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for user_roles
CREATE POLICY "Admins can read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_markets_updated_at
BEFORE UPDATE ON public.markets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
