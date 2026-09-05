package io.invenlio.organization; public final class StaleStateException extends RuntimeException{private static final long serialVersionUID=1L;public StaleStateException(){super("Resource was modified by another request");}}

