INSERT INTO permissions(permission_key, description) VALUES
 ('catalog:read','Read catalog master data'),('catalog:create','Create products and variants'),
 ('catalog:update','Update products and variants'),('catalog:archive','Archive products and variants'),
 ('catalog-category:manage','Manage catalog categories'),('catalog-brand:manage','Manage catalog brands')
ON CONFLICT (permission_key) DO NOTHING;

CREATE TABLE catalog_categories (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), name VARCHAR(120) NOT NULL,
 slug VARCHAR(120) NOT NULL, normalized_name VARCHAR(120) NOT NULL, parent_id UUID, status VARCHAR(16) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,slug),
 FOREIGN KEY(tenant_id,parent_id) REFERENCES catalog_categories(tenant_id,id) ON DELETE RESTRICT,
 CHECK(status IN ('ACTIVE','ARCHIVED')), CHECK(parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX uq_catalog_category_sibling_name ON catalog_categories(tenant_id,COALESCE(parent_id,'00000000-0000-0000-0000-000000000000'),normalized_name);
CREATE TABLE catalog_brands (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), name VARCHAR(120) NOT NULL,
 slug VARCHAR(120) NOT NULL, normalized_name VARCHAR(120) NOT NULL, status VARCHAR(16) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,slug), UNIQUE(tenant_id,normalized_name), CHECK(status IN ('ACTIVE','ARCHIVED'))
);
CREATE TABLE catalog_products (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), name VARCHAR(200) NOT NULL,
 description VARCHAR(4000), status VARCHAR(16) NOT NULL, category_id UUID, brand_id UUID, base_unit VARCHAR(8) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,category_id) REFERENCES catalog_categories(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,brand_id) REFERENCES catalog_brands(tenant_id,id) ON DELETE RESTRICT,
 CHECK(status IN ('DRAFT','ACTIVE','INACTIVE','ARCHIVED'))
);
CREATE INDEX idx_catalog_products_tenant_status ON catalog_products(tenant_id,status);
CREATE INDEX idx_catalog_products_tenant_category ON catalog_products(tenant_id,category_id);
CREATE INDEX idx_catalog_products_tenant_brand ON catalog_products(tenant_id,brand_id);
CREATE INDEX idx_catalog_products_name_lower ON catalog_products(tenant_id,lower(name));
CREATE TABLE catalog_product_options (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, product_id UUID NOT NULL, name VARCHAR(80) NOT NULL,
 normalized_name VARCHAR(80) NOT NULL, position INTEGER NOT NULL CHECK(position >= 0),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,product_id,normalized_name), UNIQUE(tenant_id,product_id,position),
 FOREIGN KEY(tenant_id,product_id) REFERENCES catalog_products(tenant_id,id) ON DELETE RESTRICT
);
CREATE TABLE catalog_product_option_values (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, product_id UUID NOT NULL, option_id UUID NOT NULL,
 value VARCHAR(80) NOT NULL, normalized_value VARCHAR(80) NOT NULL, position INTEGER NOT NULL CHECK(position >= 0),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,option_id,normalized_value), UNIQUE(tenant_id,option_id,position),
 FOREIGN KEY(tenant_id,product_id) REFERENCES catalog_products(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,option_id) REFERENCES catalog_product_options(tenant_id,id) ON DELETE RESTRICT
);
CREATE TABLE catalog_product_variants (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, product_id UUID NOT NULL, sku VARCHAR(80) NOT NULL,
 normalized_sku VARCHAR(80) NOT NULL, status VARCHAR(16) NOT NULL, display_name VARCHAR(200), base_unit VARCHAR(8) NOT NULL,
 weight_grams BIGINT, length_mm BIGINT, width_mm BIGINT, height_mm BIGINT, option_signature VARCHAR(2000) NOT NULL,
 standard_cost NUMERIC(19,4), list_price NUMERIC(19,4), currency VARCHAR(3),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,normalized_sku), UNIQUE(tenant_id,product_id,option_signature),
 FOREIGN KEY(tenant_id,product_id) REFERENCES catalog_products(tenant_id,id) ON DELETE RESTRICT,
 CHECK(status IN ('DRAFT','ACTIVE','INACTIVE','ARCHIVED')),
 CHECK(weight_grams BETWEEN 0 AND 1000000000), CHECK(length_mm BETWEEN 0 AND 10000000),
 CHECK(width_mm BETWEEN 0 AND 10000000), CHECK(height_mm BETWEEN 0 AND 10000000),
 CHECK(standard_cost >= 0), CHECK(list_price >= 0), CHECK((standard_cost IS NULL AND list_price IS NULL) OR currency IS NOT NULL)
);
CREATE INDEX idx_catalog_variants_product_status ON catalog_product_variants(tenant_id,product_id,status);
CREATE TABLE catalog_variant_option_selections (
 tenant_id UUID NOT NULL, product_id UUID NOT NULL, variant_id UUID NOT NULL, option_id UUID NOT NULL, option_value_id UUID NOT NULL,
 PRIMARY KEY(tenant_id,variant_id,option_id), UNIQUE(tenant_id,variant_id,option_value_id),
 FOREIGN KEY(tenant_id,variant_id) REFERENCES catalog_product_variants(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,product_id) REFERENCES catalog_products(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,option_id) REFERENCES catalog_product_options(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,option_value_id) REFERENCES catalog_product_option_values(tenant_id,id) ON DELETE RESTRICT
);
CREATE TABLE catalog_barcodes (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, variant_id UUID NOT NULL, type VARCHAR(16) NOT NULL,
 value VARCHAR(128) NOT NULL, normalized_value VARCHAR(128) NOT NULL, primary_barcode BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,normalized_value),
 FOREIGN KEY(tenant_id,variant_id) REFERENCES catalog_product_variants(tenant_id,id) ON DELETE RESTRICT,
 CHECK(type IN ('GTIN_8','GTIN_12','GTIN_13','GTIN_14','CODE_128','INTERNAL')), CHECK(NOT primary_barcode OR active)
);
CREATE UNIQUE INDEX uq_catalog_primary_barcode ON catalog_barcodes(tenant_id,variant_id) WHERE primary_barcode;
CREATE INDEX idx_catalog_barcode_lookup ON catalog_barcodes(tenant_id,normalized_value) WHERE active;
INSERT INTO role_permissions(tenant_id,role_id,permission_key)
SELECT r.tenant_id,r.id,p.permission_key FROM roles r CROSS JOIN permissions p
WHERE r.system_role AND r.name='ORGANIZATION_ADMIN' AND p.permission_key LIKE 'catalog%' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key)
SELECT r.tenant_id,r.id,'catalog:read' FROM roles r WHERE r.system_role AND r.name IN ('READ_ONLY','AUDITOR') ON CONFLICT DO NOTHING;
