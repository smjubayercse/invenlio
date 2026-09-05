package io.invenlio.organization;
import java.util.*; import org.springframework.data.domain.*; import org.springframework.data.jpa.repository.JpaRepository;
interface MembershipRepository extends JpaRepository<OrganizationMembership,UUID>{Optional<OrganizationMembership> findByIdAndTenantId(UUID id,UUID tenantId); Optional<OrganizationMembership> findByTenantIdAndUserIdentityId(UUID tenantId,UUID userId); Page<OrganizationMembership> findAllByTenantId(UUID tenantId,Pageable pageable);}
