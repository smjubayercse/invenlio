package io.invenlio.organization;

import java.util.Optional;

public interface TenantContext {
    Optional<TenantId> currentTenant();

    default TenantId requireTenant() {
        return currentTenant().orElseThrow(() -> new TenantContextMissingException("Authenticated tenant context is required"));
    }
}

