package io.invenlio;

import org.junit.jupiter.api.Test;
import org.flywaydb.core.Flyway;
import java.sql.DriverManager;
import java.util.UUID;
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
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("9");
        assertThat(jdbc.queryForObject("SELECT schema_generation FROM foundation_metadata WHERE id = 1", Integer.class))
                .isEqualTo(1);
    }

    @Test
    void upgradeFromV8ToV9PreservesSupplierData() throws Exception {
        String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
        }
        Flyway v8 = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema).defaultSchema(schema).target("8").load();
        v8.migrate();
        UUID tenant = UUID.randomUUID(), supplier = UUID.randomUUID();
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            statement.execute("INSERT INTO organizations(id,name,slug,status,default_locale,default_timezone,default_currency,created_at,updated_at,version) VALUES('"+tenant+"','Upgrade','upgrade','ACTIVE','en','UTC','EUR',now(),now(),0)");
            statement.execute("INSERT INTO suppliers(id,tenant_id,supplier_number,normalized_supplier_number,name,status,default_currency,created_at,updated_at,version) VALUES('"+supplier+"','"+tenant+"','SUP-UP','SUP-UP','Upgrade Supplier','ACTIVE','EUR',now(),now(),0)");
        }
        Flyway latest = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema).defaultSchema(schema).load();
        latest.migrate();
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            try (var result = statement.executeQuery("SELECT count(*) FROM suppliers WHERE id='"+supplier+"'")) { result.next(); assertThat(result.getInt(1)).isEqualTo(1); }
            try (var result = statement.executeQuery("SELECT count(*) FROM purchase_orders")) { result.next(); assertThat(result.getInt(1)).isZero(); }
        }
    }
}
