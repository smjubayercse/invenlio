package io.invenlio.organization;
import java.util.*; import org.springframework.data.jpa.repository.Query; import org.springframework.data.repository.query.Param;
interface AuthorizationQuery extends org.springframework.data.repository.Repository<OrganizationMembership,UUID>{
 @Query(value="SELECT count(*) > 0 FROM organization_memberships m JOIN membership_roles mr ON mr.tenant_id=m.tenant_id AND mr.membership_id=m.id JOIN role_permissions rp ON rp.tenant_id=mr.tenant_id AND rp.role_id=mr.role_id WHERE m.tenant_id=:tenant AND m.user_identity_id=:user AND m.status='ACTIVE' AND rp.permission_key=:permission",nativeQuery=true) boolean hasPermission(@Param("tenant")UUID tenant,@Param("user")UUID user,@Param("permission")String permission);
}
