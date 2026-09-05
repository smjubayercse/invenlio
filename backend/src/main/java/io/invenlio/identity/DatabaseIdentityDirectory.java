package io.invenlio.identity;
import java.util.*;
import org.springframework.stereotype.Service;
@Service final class DatabaseIdentityDirectory implements IdentityDirectory {
 private final UserIdentityRepository repository; DatabaseIdentityDirectory(UserIdentityRepository r){repository=r;}
 public Optional<IdentityReference> findActiveBySubject(String subject){return repository.findByKeycloakSubject(subject).filter(UserIdentity::active).map(i->new IdentityReference(i.id(),i.subject()));}
}

