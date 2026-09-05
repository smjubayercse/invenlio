package io.invenlio.organization;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
interface OrganizationRepository extends JpaRepository<Organization,UUID>{Optional<Organization> findByIdAndStatus(UUID id,Organization.Status status);}
