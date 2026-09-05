-- DEVELOPMENT ONLY. Idempotently links the imported Keycloak user to one local organization.
INSERT INTO organizations(id,name,slug,legal_name,status,default_locale,default_timezone,default_currency,created_at,updated_at,version)
VALUES ('11111111-1111-4111-8111-111111111111','Invenlio Local Organization','invenlio-local',NULL,'ACTIVE','en','Europe/Berlin','EUR',now(),now(),0)
ON CONFLICT DO NOTHING;
INSERT INTO user_identities(id,keycloak_subject,email,display_name,status,created_at,updated_at)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','admin@invenlio.local','Local Administrator','ACTIVE',now(),now())
ON CONFLICT DO NOTHING;
INSERT INTO organization_memberships(id,tenant_id,user_identity_id,status,created_at,updated_at,version)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ACTIVE',now(),now(),0)
ON CONFLICT DO NOTHING;
INSERT INTO roles(id,tenant_id,name,system_role,created_at,updated_at,version) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','ORGANIZATION_ADMIN',true,now(),now(),0),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','AUDITOR',true,now(),now(),0),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','11111111-1111-4111-8111-111111111111','READ_ONLY',true,now(),now(),0)
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key)
SELECT '11111111-1111-4111-8111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc',permission_key FROM permissions ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key) VALUES
('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','organization:read'),
('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','member:read'),
('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','role:read'),
('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','audit:read'),
('11111111-1111-4111-8111-111111111111','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','organization:read') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key) VALUES
('11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','catalog:read'),
('11111111-1111-4111-8111-111111111111','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','catalog:read') ON CONFLICT DO NOTHING;
INSERT INTO membership_roles(tenant_id,membership_id,role_id) VALUES ('11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc') ON CONFLICT DO NOTHING;
