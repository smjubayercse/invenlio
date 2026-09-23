package io.invenlio.organization;
import io.invenlio.identity.IdentityDirectory; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.security.oauth2.jwt.Jwt; import org.springframework.stereotype.Service;
@Service public class AuthorizationService {
 private final TenantContext tenants; private final IdentityDirectory identities; private final OrganizationRepository organizations; private final AuthorizationQuery query;
 AuthorizationService(TenantContext t,IdentityDirectory i,OrganizationRepository o,AuthorizationQuery q){tenants=t;identities=i;organizations=o;query=q;}
 public Access require(Permission permission){var access=current();if(!query.hasPermission(access.tenantId(),access.userId(),permission.key()))throw new AccessDeniedException("Permission denied");return access;}
 public Access current(){var auth=SecurityContextHolder.getContext().getAuthentication();if(auth==null||!(auth.getPrincipal() instanceof Jwt jwt)||jwt.getSubject()==null||jwt.getSubject().isBlank())throw new AccessDeniedException("Authenticated subject required");var tenant=tenants.requireTenant().value();if(organizations.findByIdAndStatus(tenant,Organization.Status.ACTIVE).isEmpty())throw new AccessDeniedException("Organization access denied");var identity=identities.findActiveBySubject(jwt.getSubject()).orElseThrow(()->new AccessDeniedException("Organization access denied"));if(!query.hasActiveMembership(tenant,identity.id()))throw new AccessDeniedException("Organization access denied");return new Access(tenant,identity.id(),identity.subject());}
 public record Access(java.util.UUID tenantId,java.util.UUID userId,String subject){}
}
