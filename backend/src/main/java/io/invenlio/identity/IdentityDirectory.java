package io.invenlio.identity;
import java.util.*;
public interface IdentityDirectory { Optional<IdentityReference> findActiveBySubject(String subject); record IdentityReference(UUID id,String subject){} }

