CREATE TABLE suppliers (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), supplier_number VARCHAR(40) NOT NULL,
 normalized_supplier_number VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, legal_name VARCHAR(200), status VARCHAR(16) NOT NULL,
 tax_id VARCHAR(64), tax_country_code CHAR(2), registration_number VARCHAR(64), email VARCHAR(254), phone VARCHAR(40), website VARCHAR(500),
 default_currency CHAR(3) NOT NULL, payment_terms_days INTEGER, default_lead_time_days INTEGER, notes VARCHAR(2000),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,normalized_supplier_number),
 CHECK(status IN('DRAFT','ACTIVE','INACTIVE','BLOCKED','ARCHIVED')), CHECK(tax_country_code IS NULL OR tax_country_code ~ '^[A-Z]{2}$'),
 CHECK(default_currency ~ '^[A-Z]{3}$'), CHECK(payment_terms_days BETWEEN 0 AND 3650), CHECK(default_lead_time_days BETWEEN 0 AND 3650));
CREATE TABLE supplier_addresses (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, supplier_id UUID NOT NULL, type VARCHAR(16) NOT NULL, label VARCHAR(120),
 address_line1 VARCHAR(200) NOT NULL, address_line2 VARCHAR(200), postal_code VARCHAR(24) NOT NULL, city VARCHAR(120) NOT NULL,
 state_region VARCHAR(120), country_code CHAR(2) NOT NULL, is_primary BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,supplier_id,id), FOREIGN KEY(tenant_id,supplier_id) REFERENCES suppliers(tenant_id,id) ON DELETE RESTRICT,
 CHECK(type IN('REGISTERED','ORDERING','SHIPPING','BILLING','RETURNS','OTHER')), CHECK(status IN('ACTIVE','ARCHIVED')), CHECK(country_code ~ '^[A-Z]{2}$'));
CREATE UNIQUE INDEX uq_supplier_primary_address ON supplier_addresses(tenant_id,supplier_id,type) WHERE is_primary AND status='ACTIVE';
CREATE TABLE supplier_contacts (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, supplier_id UUID NOT NULL, first_name VARCHAR(120) NOT NULL, last_name VARCHAR(120) NOT NULL,
 job_title VARCHAR(120), email VARCHAR(254), phone VARCHAR(40), role VARCHAR(16) NOT NULL, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,supplier_id,id), FOREIGN KEY(tenant_id,supplier_id) REFERENCES suppliers(tenant_id,id) ON DELETE RESTRICT,
 CHECK(role IN('SALES','ORDERING','LOGISTICS','ACCOUNTS','QUALITY','GENERAL')), CHECK(email IS NOT NULL OR phone IS NOT NULL));
CREATE UNIQUE INDEX uq_supplier_primary_contact ON supplier_contacts(tenant_id,supplier_id,role) WHERE is_primary AND active;
CREATE TABLE supplier_products (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, supplier_id UUID NOT NULL, variant_id UUID NOT NULL, supplier_sku VARCHAR(128) NOT NULL,
 normalized_supplier_sku VARCHAR(128) NOT NULL, supplier_product_name VARCHAR(200), purchase_unit_code VARCHAR(8) NOT NULL,
 base_units_per_purchase_unit NUMERIC(19,6) NOT NULL DEFAULT 1, minimum_order_quantity NUMERIC(19,6), order_multiple NUMERIC(19,6),
 unit_cost NUMERIC(19,6), currency CHAR(3) NOT NULL, lead_time_days INTEGER, preferred BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,supplier_id,variant_id), UNIQUE(tenant_id,supplier_id,normalized_supplier_sku),
 FOREIGN KEY(tenant_id,supplier_id) REFERENCES suppliers(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,variant_id) REFERENCES catalog_product_variants(tenant_id,id) ON DELETE RESTRICT,
 CHECK(base_units_per_purchase_unit>0), CHECK(minimum_order_quantity IS NULL OR minimum_order_quantity>0),
 CHECK(order_multiple IS NULL OR order_multiple>0), CHECK(unit_cost IS NULL OR unit_cost>=0), CHECK(currency ~ '^[A-Z]{3}$'),
 CHECK(lead_time_days BETWEEN 0 AND 3650), CHECK(active OR NOT preferred));
CREATE UNIQUE INDEX uq_preferred_supplier_variant ON supplier_products(tenant_id,variant_id) WHERE preferred AND active;
CREATE FUNCTION prevent_procurement_ownership_change() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.tenant_id<>OLD.tenant_id OR NEW.supplier_id<>OLD.supplier_id THEN RAISE EXCEPTION 'procurement ownership is immutable' USING ERRCODE='55000'; END IF; RETURN NEW; END$$;
CREATE FUNCTION prevent_supplier_product_variant_change() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.variant_id<>OLD.variant_id THEN RAISE EXCEPTION 'supplier product variant is immutable' USING ERRCODE='55000'; END IF; RETURN NEW; END$$;
CREATE TRIGGER supplier_address_ownership_immutable BEFORE UPDATE ON supplier_addresses FOR EACH ROW EXECUTE FUNCTION prevent_procurement_ownership_change();
CREATE TRIGGER supplier_contact_ownership_immutable BEFORE UPDATE ON supplier_contacts FOR EACH ROW EXECUTE FUNCTION prevent_procurement_ownership_change();
CREATE TRIGGER supplier_product_ownership_immutable BEFORE UPDATE ON supplier_products FOR EACH ROW EXECUTE FUNCTION prevent_procurement_ownership_change();
CREATE TRIGGER supplier_product_variant_immutable BEFORE UPDATE ON supplier_products FOR EACH ROW EXECUTE FUNCTION prevent_supplier_product_variant_change();
CREATE INDEX idx_suppliers_status ON suppliers(tenant_id,status); CREATE INDEX idx_suppliers_country ON suppliers(tenant_id,tax_country_code);
CREATE INDEX idx_supplier_addresses_owner ON supplier_addresses(tenant_id,supplier_id); CREATE INDEX idx_supplier_contacts_owner ON supplier_contacts(tenant_id,supplier_id);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(tenant_id,supplier_id); CREATE INDEX idx_supplier_products_variant ON supplier_products(tenant_id,variant_id);
INSERT INTO permissions(permission_key,description) VALUES ('procurement-supplier:read','Read supplier master data'),('procurement-supplier:manage','Manage supplier master data') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key) SELECT r.tenant_id,r.id,p.permission_key FROM roles r CROSS JOIN permissions p WHERE r.system_role AND r.name='ORGANIZATION_ADMIN' AND p.permission_key LIKE 'procurement-supplier:%' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key) SELECT r.tenant_id,r.id,'procurement-supplier:read' FROM roles r WHERE r.system_role AND r.name IN('READ_ONLY','AUDITOR') ON CONFLICT DO NOTHING;
