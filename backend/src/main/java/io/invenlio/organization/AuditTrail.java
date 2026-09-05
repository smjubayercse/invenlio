package io.invenlio.organization;
public interface AuditTrail { void record(AuthorizationService.Access actor,String action,String entityType,String entityId); }
