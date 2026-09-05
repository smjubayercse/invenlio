package io.invenlio.organization;
import jakarta.persistence.*; import java.time.Instant; import java.util.*;
@Entity @Table(name="organization_memberships")
class OrganizationMembership {
 @Id private UUID id; @Column(name="tenant_id",nullable=false,updatable=false) private UUID tenantId; @Column(name="user_identity_id",nullable=false,updatable=false) private UUID userIdentityId;
 @Enumerated(EnumType.STRING) private Status status; @Column(name="created_at") private Instant createdAt; @Column(name="updated_at") private Instant updatedAt; @Version private long version;
 protected OrganizationMembership(){} OrganizationMembership(UUID id,UUID tenant,UUID user,Status status){this.id=id;tenantId=tenant;userIdentityId=user;this.status=status;createdAt=Instant.now();updatedAt=createdAt;}
 void transition(Status next){if(status==Status.REMOVED||status==next||!allowed(status,next))throw new InvalidOperationException("Invalid membership transition");status=next;updatedAt=Instant.now();}
 private static boolean allowed(Status from,Status to){return switch(from){case INVITED->to==Status.ACTIVE||to==Status.REMOVED;case ACTIVE->to==Status.SUSPENDED||to==Status.REMOVED;case SUSPENDED->to==Status.ACTIVE||to==Status.REMOVED;case REMOVED->false;};}
 UUID id(){return id;} UUID tenantId(){return tenantId;} UUID userIdentityId(){return userIdentityId;} Status status(){return status;} long version(){return version;} Instant createdAt(){return createdAt;} Instant updatedAt(){return updatedAt;}
 enum Status{INVITED,ACTIVE,SUSPENDED,REMOVED}
}

