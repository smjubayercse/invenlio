package io.invenlio.organization;
import jakarta.persistence.*; import java.time.Instant; import java.util.*;
@Entity @Table(name="roles") class Role {
 @Id private UUID id; @Column(name="tenant_id",nullable=false,updatable=false) private UUID tenantId; @Column(nullable=false) private String name; @Column(name="system_role") private boolean systemRole; @Column(name="created_at") private Instant createdAt; @Column(name="updated_at") private Instant updatedAt; @Version private long version;
 protected Role(){} Role(UUID id,UUID tenant,String name,boolean system){this.id=id;tenantId=tenant;this.name=validate(name);systemRole=system;createdAt=Instant.now();updatedAt=createdAt;} private static String validate(String n){if(n==null||!n.matches("[A-Z][A-Z0-9_]{2,79}"))throw new IllegalArgumentException("Invalid role name");return n;} UUID id(){return id;} UUID tenantId(){return tenantId;} String name(){return name;} boolean systemRole(){return systemRole;} long version(){return version;}
}

