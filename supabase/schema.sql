-- Esquema do Banco de Dados para ERP Estética
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Usuário (extensão da auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    birthdate DATE,
    document VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    sale_value DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Despesas
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'variable' CHECK (type IN ('fixed', 'variable')),
    value DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vendas
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    product_id UUID REFERENCES products(id),
    value DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (value * quantity) STORED,
    sale_date DATE NOT NULL,
    forma_pagamento VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_document ON clients(document);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_client ON sales(client_id);
CREATE INDEX idx_sales_product ON sales(product_id);

-- Função para gerar código automático de produto
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code := 'PROD-' || LPAD(CAST(NEXTVAL('product_code_seq') AS VARCHAR), 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar sequência para código do produto
CREATE SEQUENCE IF NOT EXISTS product_code_seq START 1;

-- Trigger para gerar código automaticamente
CREATE TRIGGER trg_generate_product_code
    BEFORE INSERT ON products
    FOR EACH ROW
    WHEN (NEW.code IS NULL)
    EXECUTE FUNCTION generate_product_code();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Usuários podem ver seus próprios dados"
    ON users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os usuários"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins podem inserir usuários"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins podem atualizar usuários"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para clients
CREATE POLICY "Usuários autenticados podem ver clientes"
    ON clients FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir clientes"
    ON clients FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar clientes"
    ON clients FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar clientes"
    ON clients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para products
CREATE POLICY "Usuários autenticados podem ver produtos"
    ON products FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar produtos"
    ON products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar produtos"
    ON products FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Políticas para expenses
CREATE POLICY "Usuários autenticados podem ver despesas"
    ON expenses FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar despesas"
    ON expenses FOR ALL
    USING (auth.role() = 'authenticated');

-- Políticas para sales
CREATE POLICY "Usuários autenticados podem ver vendas"
    ON sales FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar vendas"
    ON sales FOR ALL
    USING (auth.role() = 'authenticated');

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (user_id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();