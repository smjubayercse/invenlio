package io.invenlio.organization;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthenticatedTenantContextTest {
    private final AuthenticatedTenantContext context = new AuthenticatedTenantContext();

    @AfterEach void clearSecurityContext() { SecurityContextHolder.clearContext(); }

    @Test
    void obtainsTenantOnlyFromAuthenticatedJwtClaim() {
        UUID tenant = UUID.randomUUID();
        Jwt jwt = new Jwt("token", Instant.now(), Instant.now().plusSeconds(60), Map.of("alg", "none"), Map.of("tenant_id", tenant.toString(), "sub", "user"));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(jwt, null));
        assertThat(context.requireTenant()).isEqualTo(new TenantId(tenant));
    }

    @Test
    void failsClosedWithoutTenantClaim() {
        assertThat(context.currentTenant()).isEmpty();
        assertThatThrownBy(context::requireTenant).isInstanceOf(TenantContextMissingException.class);
    }
}

