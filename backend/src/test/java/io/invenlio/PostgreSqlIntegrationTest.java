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
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("13");
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

    @Test
    void upgradeFromV9ToV10PreservesPurchaseOrdersAndAddsReceiptProgress() throws Exception {
        String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()); var statement = connection.createStatement()) { statement.execute("CREATE SCHEMA " + schema); }
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()).schemas(schema).defaultSchema(schema).target("9").load().migrate();
        UUID tenant=UUID.randomUUID(),supplier=UUID.randomUUID(),warehouse=UUID.randomUUID(),user=UUID.randomUUID(),product=UUID.randomUUID(),variant=UUID.randomUUID(),sp=UUID.randomUUID(),po=UUID.randomUUID(),line=UUID.randomUUID();
        try(var c=DriverManager.getConnection(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword());var s=c.createStatement()){s.execute("SET search_path TO "+schema);s.execute("INSERT INTO organizations(id,name,slug,status,default_locale,default_timezone,default_currency,created_at,updated_at,version)VALUES('"+tenant+"','Upgrade','up10','ACTIVE','en','UTC','EUR',now(),now(),0)");s.execute("INSERT INTO user_identities(id,keycloak_subject,status,created_at,updated_at)VALUES('"+user+"','upgrade-user','ACTIVE',now(),now())");s.execute("INSERT INTO suppliers(id,tenant_id,supplier_number,normalized_supplier_number,name,status,default_currency,created_at,updated_at,version)VALUES('"+supplier+"','"+tenant+"','S','S','Supplier','ACTIVE','EUR',now(),now(),0)");s.execute("INSERT INTO warehouses(id,tenant_id,code,normalized_code,name,status,timezone,created_at,updated_at,version)VALUES('"+warehouse+"','"+tenant+"','W','W','Warehouse','ACTIVE','UTC',now(),now(),0)");s.execute("INSERT INTO catalog_products(id,tenant_id,name,status,base_unit,created_at,updated_at,version)VALUES('"+product+"','"+tenant+"','P','ACTIVE','EA',now(),now(),0)");s.execute("INSERT INTO catalog_product_variants(id,tenant_id,product_id,sku,normalized_sku,status,display_name,base_unit,option_signature,created_at,updated_at,version)VALUES('"+variant+"','"+tenant+"','"+product+"','V','V','ACTIVE','V','EA','DEFAULT',now(),now(),0)");s.execute("INSERT INTO supplier_products(id,tenant_id,supplier_id,variant_id,supplier_sku,normalized_supplier_sku,purchase_unit_code,base_units_per_purchase_unit,unit_cost,currency,active,preferred,created_at,updated_at,version)VALUES('"+sp+"','"+tenant+"','"+supplier+"','"+variant+"','X','X','EA',1,1,'EUR',true,false,now(),now(),0)");s.execute("INSERT INTO purchase_orders(id,tenant_id,supplier_id,warehouse_id,purchase_order_number,status,supplier_number_snapshot,supplier_name_snapshot,warehouse_code_snapshot,warehouse_name_snapshot,currency,subtotal,total,created_by,created_at,updated_at,version)VALUES('"+po+"','"+tenant+"','"+supplier+"','"+warehouse+"','PO-U','DRAFT','S','Supplier','W','Warehouse','EUR',1,1,'"+user+"',now(),now(),0)");s.execute("INSERT INTO purchase_order_lines(id,tenant_id,purchase_order_id,supplier_id,supplier_product_id,variant_id,line_number,supplier_sku_snapshot,variant_sku_snapshot,description_snapshot,ordered_quantity,purchase_unit_code,base_units_per_purchase_unit,base_quantity,unit_cost,currency,line_subtotal,created_at,updated_at,version)VALUES('"+line+"','"+tenant+"','"+po+"','"+supplier+"','"+sp+"','"+variant+"',1,'X','V','V',1,'EA',1,1,1,'EUR',1,now(),now(),0)");s.execute("UPDATE purchase_orders SET status='SENT' WHERE id='"+po+"'");}
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()).schemas(schema).defaultSchema(schema).load().migrate();
        try(var c=DriverManager.getConnection(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword());var s=c.createStatement()){s.execute("SET search_path TO "+schema);try(var r=s.executeQuery("SELECT received_base_quantity FROM purchase_order_lines WHERE id='"+line+"'")){r.next();assertThat(r.getBigDecimal(1)).isEqualByComparingTo("0");}try(var r=s.executeQuery("SELECT count(*) FROM goods_receipts")){r.next();assertThat(r.getInt(1)).isZero();}}
    }
}
