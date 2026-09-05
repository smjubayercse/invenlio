package io.invenlio.organization;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
final class AuthenticatedTenantContext implements TenantContext {
    private static final String TENANT_CLAIM = "tenant_id";

    @Override
    public Optional<TenantId> currentTenant() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }
        String claim = jwt.getClaimAsString(TENANT_CLAIM);
        if (claim == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new TenantId(UUID.fromString(claim)));
        } catch (IllegalArgumentException invalidTenantId) {
            return Optional.empty();
        }
    }
}

