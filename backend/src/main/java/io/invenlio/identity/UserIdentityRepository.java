package io.invenlio.identity;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
interface UserIdentityRepository extends JpaRepository<UserIdentity,UUID>{Optional<UserIdentity> findByKeycloakSubject(String subject);}

