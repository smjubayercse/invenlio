package io.invenlio;

import java.sql.DriverManager;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class V12MigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer DB = new PostgreSQLContainer("postgres:17.6-alpine");

    @Test
    void upgradeFromV11PreservesSalesDataAndAddsFulfillmentSchema() throws Exception {
        String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
        try (var connection = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
        }
        Flyway.configure().dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())
            .schemas(schema).defaultSchema(schema).target("11").load().migrate();
        UUID tenant = UUID.randomUUID();
        try (var connection = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            statement.execute("INSERT INTO organizations(id,name,slug,status,default_locale,default_timezone,default_currency,created_at,updated_at,version) VALUES('"
                + tenant + "','Upgrade','fulfillment-upgrade','ACTIVE','en','UTC','EUR',now(),now(),0)");
        }
        Flyway latest = Flyway.configure().dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())
            .schemas(schema).defaultSchema(schema).load();
        latest.migrate();
        assertThat(latest.info().current().getVersion().getVersion()).isEqualTo("12");
        try (var connection = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            try (var rows = statement.executeQuery("SELECT count(*) FROM organizations WHERE id='" + tenant + "'")) {
                rows.next();
                assertThat(rows.getInt(1)).isOne();
            }
            try (var rows = statement.executeQuery("SELECT count(*) FROM pick_lists")) {
                rows.next();
                assertThat(rows.getInt(1)).isZero();
            }
            try (var rows = statement.executeQuery("SELECT count(*) FROM packing_sessions")) {
                rows.next();
                assertThat(rows.getInt(1)).isZero();
            }
        }
    }
}
