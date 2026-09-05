package io.invenlio.organization;

public final class TenantContextMissingException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public TenantContextMissingException(String message) {
        super(message);
    }
}
