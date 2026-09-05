package io.invenlio.organization;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
interface RoleRepository extends JpaRepository<Role,UUID>{Optional<Role> findByIdAndTenantId(UUID id,UUID tenantId); List<Role> findAllByTenantId(UUID tenantId);}
