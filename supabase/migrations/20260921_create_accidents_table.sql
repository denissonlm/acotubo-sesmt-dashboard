-- Criação da tabela de acidentes para o Dashboard SESMT Açotubo
CREATE TABLE IF NOT EXISTS public.accidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  rim_ram TEXT,
  date DATE NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  day_of_week INT NOT NULL,
  time TEXT,
  hour INT,
  period TEXT,
  re TEXT NOT NULL,
  employee TEXT NOT NULL,
  division TEXT NOT NULL,
  manager TEXT NOT NULL,
  area TEXT NOT NULL,
  role TEXT,
  type TEXT,
  lost_days INT DEFAULT 0,
  part_affected TEXT,
  experience_years NUMERIC(5,2) DEFAULT 0,
  experience_months NUMERIC(5,2) DEFAULT 0,
  unsafe_act BOOLEAN DEFAULT FALSE,
  machine_deficiency BOOLEAN DEFAULT FALSE,
  function_deviation BOOLEAN DEFAULT FALSE,
  had_training BOOLEAN DEFAULT FALSE,
  used_epi BOOLEAN DEFAULT FALSE,
  cat TEXT,
  has_cat BOOLEAN DEFAULT FALSE,
  investigation_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para alta performance nas consultas do Dashboard
CREATE INDEX IF NOT EXISTS idx_accidents_year ON public.accidents(year);
CREATE INDEX IF NOT EXISTS idx_accidents_date ON public.accidents(date);
CREATE INDEX IF NOT EXISTS idx_accidents_division ON public.accidents(division);
CREATE INDEX IF NOT EXISTS idx_accidents_area ON public.accidents(area);
CREATE INDEX IF NOT EXISTS idx_accidents_external_id ON public.accidents(external_id);

-- Habilitação de RLS (Row Level Security)
ALTER TABLE public.accidents ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para o Dashboard
CREATE POLICY "Permitir leitura pública de acidentes" 
  ON public.accidents FOR SELECT 
  USING (true);

CREATE POLICY "Permitir inserção de acidentes" 
  ON public.accidents FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de acidentes" 
  ON public.accidents FOR UPDATE 
  USING (true);

CREATE POLICY "Permitir deleção de acidentes" 
  ON public.accidents FOR DELETE 
  USING (true);
