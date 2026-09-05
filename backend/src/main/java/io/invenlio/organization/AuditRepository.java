package io.invenlio.organization;
import java.time.*; import java.util.*; import org.springframework.data.domain.*; import org.springframework.data.jpa.repository.JpaRepository;
interface AuditRepository extends JpaRepository<AuditEvent,UUID>{Page<AuditEvent> findAllByTenantIdAndOccurredAtBetween(UUID tenant,Instant from,Instant to,Pageable pageable);}
