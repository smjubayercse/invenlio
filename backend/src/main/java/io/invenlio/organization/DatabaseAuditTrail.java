package io.invenlio.organization;
import org.slf4j.MDC; import org.springframework.stereotype.Component;
@Component class DatabaseAuditTrail implements AuditTrail {
 private final AuditRepository repository; DatabaseAuditTrail(AuditRepository r){repository=r;}
 public void record(AuthorizationService.Access a,String action,String type,String id){repository.save(new AuditEvent(a.tenantId(),a.subject(),action,type,id,MDC.get("correlationId")));}
}
