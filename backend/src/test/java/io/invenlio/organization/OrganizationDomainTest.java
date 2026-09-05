package io.invenlio.organization;
import java.util.UUID; import org.junit.jupiter.api.Test; import static org.assertj.core.api.Assertions.*;
class OrganizationDomainTest {
 @Test void normalizesAndValidatesSettings(){var o=new Organization(UUID.randomUUID(),"  Alpine GmbH  ","Alpine-GmbH",null,"de-DE","Europe/Vienna","eur");assertThat(o.name()).isEqualTo("Alpine GmbH");assertThat(o.slug()).isEqualTo("alpine-gmbh");assertThat(o.currency()).isEqualTo("EUR");}
 @Test void rejectsInvalidSettings(){assertThatThrownBy(()->new Organization(UUID.randomUUID(),"X","not valid",null,"de","Europe/Vienna","EUR")).isInstanceOf(IllegalArgumentException.class);assertThatThrownBy(()->new Organization(UUID.randomUUID(),"X","valid",null,"de","Mars/Base","EUR")).isInstanceOf(Exception.class);assertThatThrownBy(()->new Organization(UUID.randomUUID(),"X","valid",null,"de","UTC","ZZZ")).isInstanceOf(IllegalArgumentException.class);}
 @Test void membershipTransitionsFailClosed(){var m=new OrganizationMembership(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),OrganizationMembership.Status.INVITED);m.transition(OrganizationMembership.Status.ACTIVE);m.transition(OrganizationMembership.Status.REMOVED);assertThatThrownBy(()->m.transition(OrganizationMembership.Status.ACTIVE)).isInstanceOf(InvalidOperationException.class);}
}
