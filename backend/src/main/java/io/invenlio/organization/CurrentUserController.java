package io.invenlio.organization;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only browser bootstrap; authorization still occurs on every backend operation. */
@RestController
@RequestMapping("/api/v1/me")
@SecurityRequirement(name="bearerAuth")
class CurrentUserController {
    private final AuthorizationService authorization;
    private final AuthorizationQuery query;

    CurrentUserController(AuthorizationService authorization, AuthorizationQuery query) {
        this.authorization = authorization;
        this.query = query;
    }

    @Operation(summary="Get the active tenant identity and effective application permissions")
    @GetMapping
    Me current() {
        var access = authorization.current();
        return new Me(access.tenantId(), access.userId(), access.subject(),
            query.permissions(access.tenantId(), access.userId()));
    }

    record Me(UUID tenantId, UUID userId, String subject, List<String> permissions) {}
}
