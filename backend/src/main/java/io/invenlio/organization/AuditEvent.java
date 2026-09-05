package io.invenlio.organization;
import jakarta.persistence.*; import java.time.Instant; import java.util.*; import org.hibernate.annotations.JdbcTypeCode; import org.hibernate.type.SqlTypes;
@Entity @Table(name="audit_events") class AuditEvent {
 @Id private UUID id; @Column(name="tenant_id",updatable=false) private UUID tenantId; @Column(name="actor_subject",updatable=false) private String actorSubject; @Column(updatable=false) private String action; @Column(name="entity_type",updatable=false) private String entityType; @Column(name="entity_id",updatable=false) private String entityId; @Column(name="occurred_at",updatable=false) private Instant occurredAt; @Column(name="correlation_id",updatable=false) private String correlationId; @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb",updatable=false) private String metadata="{}";
 protected AuditEvent(){} AuditEvent(UUID tenant,String actor,String action,String type,String entity,String correlation){id=UUID.randomUUID();tenantId=tenant;actorSubject=actor;this.action=action;entityType=type;entityId=entity;occurredAt=Instant.now();correlationId=correlation;}
 UUID id(){return id;} String action(){return action;} String entityType(){return entityType;} String entityId(){return entityId;} String actor(){return actorSubject;} Instant at(){return occurredAt;} String correlation(){return correlationId;}
}
