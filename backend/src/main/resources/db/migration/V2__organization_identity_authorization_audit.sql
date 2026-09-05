CREATE TABLE organizations (
 id UUID PRIMARY KEY, name VARCHAR(160) NOT NULL, slug VARCHAR(80) NOT NULL UNIQUE,
 legal_name VARCHAR(200), status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED')),
 default_locale VARCHAR(16) NOT NULL, default_timezone VARCHAR(64) NOT NULL, default_currency VARCHAR(3) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE user_identities (
 id UUID PRIMARY KEY, keycloak_subject VARCHAR(255) NOT NULL UNIQUE, email VARCHAR(320), display_name VARCHAR(160),
 status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE','DISABLED')), created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_user_identities_subject ON user_identities(keycloak_subject);

CREATE TABLE permissions (
 permission_key VARCHAR(64) PRIMARY KEY,
 description VARCHAR(255) NOT NULL
);

CREATE TABLE roles (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), name VARCHAR(80) NOT NULL,
 system_role BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
 version BIGINT NOT NULL DEFAULT 0, UNIQUE (tenant_id, name), UNIQUE (tenant_id, id)
);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);

CREATE TABLE role_permissions (
 tenant_id UUID NOT NULL, role_id UUID NOT NULL, permission_key VARCHAR(64) NOT NULL REFERENCES permissions(permission_key),
 PRIMARY KEY (tenant_id, role_id, permission_key), FOREIGN KEY (tenant_id, role_id) REFERENCES roles(tenant_id, id)
);

CREATE TABLE organization_memberships (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), user_identity_id UUID NOT NULL REFERENCES user_identities(id),
 status VARCHAR(16) NOT NULL CHECK (status IN ('INVITED','ACTIVE','SUSPENDED','REMOVED')),
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 UNIQUE (tenant_id, user_identity_id), UNIQUE (tenant_id, id)
);
CREATE INDEX idx_memberships_tenant_status ON organization_memberships(tenant_id, status);
CREATE INDEX idx_memberships_tenant_user ON organization_memberships(tenant_id, user_identity_id);

CREATE TABLE membership_roles (
 tenant_id UUID NOT NULL, membership_id UUID NOT NULL, role_id UUID NOT NULL,
 PRIMARY KEY (tenant_id, membership_id, role_id),
 FOREIGN KEY (tenant_id, membership_id) REFERENCES organization_memberships(tenant_id, id),
 FOREIGN KEY (tenant_id, role_id) REFERENCES roles(tenant_id, id)
);

CREATE TABLE audit_events (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES organizations(id), actor_subject VARCHAR(255) NOT NULL,
 action VARCHAR(80) NOT NULL, entity_type VARCHAR(80) NOT NULL, entity_id VARCHAR(255) NOT NULL,
 occurred_at TIMESTAMPTZ NOT NULL, correlation_id VARCHAR(128), metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_audit_events_tenant_time ON audit_events(tenant_id, occurred_at DESC);

INSERT INTO permissions(permission_key, description) VALUES
 ('organization:read','Read organization settings'),('organization:update','Update organization settings'),
 ('member:read','Read organization memberships'),('member:invite','Create an invited membership'),
 ('member:update','Change membership status'),('member:remove','Remove a membership'),
 ('role:read','Read roles'),('role:create','Create roles'),('role:update','Change roles'),
 ('role:delete','Delete roles'),('role:assign','Assign roles'),('audit:read','Read audit events');
