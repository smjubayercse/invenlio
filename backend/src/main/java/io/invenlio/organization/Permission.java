package io.invenlio.organization;
public enum Permission {
 ORGANIZATION_READ("organization:read"), ORGANIZATION_UPDATE("organization:update"), MEMBER_READ("member:read"),
 MEMBER_INVITE("member:invite"), MEMBER_UPDATE("member:update"), MEMBER_REMOVE("member:remove"), ROLE_READ("role:read"),
 ROLE_CREATE("role:create"), ROLE_UPDATE("role:update"), ROLE_DELETE("role:delete"), ROLE_ASSIGN("role:assign"), AUDIT_READ("audit:read"),
 CATALOG_READ("catalog:read"), CATALOG_CREATE("catalog:create"), CATALOG_UPDATE("catalog:update"), CATALOG_ARCHIVE("catalog:archive"),
 CATALOG_CATEGORY_MANAGE("catalog-category:manage"), CATALOG_BRAND_MANAGE("catalog-brand:manage");
 private final String key; Permission(String key){this.key=key;} public String key(){return key;}
}
