-- DEVELOPMENT ONLY. psql must receive readonly_subject from the real Keycloak user.
INSERT INTO user_identities(id,keycloak_subject,email,display_name,status,created_at,updated_at)
VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff', :'readonly_subject', 'readonly@invenlio.local','Local Read Only','ACTIVE',now(),now())
ON CONFLICT (id) DO UPDATE SET keycloak_subject=EXCLUDED.keycloak_subject, updated_at=now();
INSERT INTO organization_memberships(id,tenant_id,user_identity_id,status,created_at,updated_at,version)
VALUES ('ffffffff-ffff-4fff-8fff-fffffffffffe','11111111-1111-4111-8111-111111111111','ffffffff-ffff-4fff-8fff-ffffffffffff','ACTIVE',now(),now(),0)
ON CONFLICT DO NOTHING;
INSERT INTO membership_roles(tenant_id,membership_id,role_id)
VALUES ('11111111-1111-4111-8111-111111111111','ffffffff-ffff-4fff-8fff-fffffffffffe','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
ON CONFLICT DO NOTHING;
