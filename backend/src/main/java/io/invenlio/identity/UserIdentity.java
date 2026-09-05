package io.invenlio.identity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="user_identities")
public class UserIdentity {
 @Id private UUID id;
 @Column(name="keycloak_subject", nullable=false, unique=true) private String keycloakSubject;
 private String email;
 @Column(name="display_name") private String displayName;
 @Enumerated(EnumType.STRING) private Status status;
 @Column(name="created_at", nullable=false) private Instant createdAt;
 @Column(name="updated_at", nullable=false) private Instant updatedAt;
 protected UserIdentity() {}
 public UserIdentity(UUID id,String subject,String email,String displayName){this.id=id;this.keycloakSubject=subject;this.email=email;this.displayName=displayName;this.status=Status.ACTIVE;this.createdAt=Instant.now();this.updatedAt=createdAt;}
 public UUID id(){return id;} public String subject(){return keycloakSubject;} public boolean active(){return status==Status.ACTIVE;}
 public enum Status {ACTIVE,DISABLED}
}

