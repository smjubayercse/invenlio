package io.invenlio;

import org.junit.jupiter.api.Test;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class PostgreSqlIntegrationTest {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17.6-alpine");

    @Autowired JdbcTemplate jdbc;
    @Autowired Flyway flyway;

    @Test
    void applicationStartsAgainstMigratedPostgreSql() {
        assertThat(POSTGRES.isRunning()).isTrue();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("5");
        assertThat(jdbc.queryForObject("SELECT schema_generation FROM foundation_metadata WHERE id = 1", Integer.class))
                .isEqualTo(1);
    }
}
