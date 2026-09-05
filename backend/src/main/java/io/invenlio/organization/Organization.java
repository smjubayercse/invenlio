package io.invenlio.organization;
import jakarta.persistence.*; import java.time.Instant; import java.time.ZoneId; import java.util.*;
@Entity @Table(name="organizations")
public class Organization {
 @Id private UUID id; @Column(nullable=false) private String name; @Column(nullable=false,updatable=false) private String slug;
 @Column(name="legal_name") private String legalName; @Enumerated(EnumType.STRING) private Status status;
 @Column(name="default_locale") private String defaultLocale; @Column(name="default_timezone") private String defaultTimezone;
 @Column(name="default_currency",length=3) private String defaultCurrency; @Column(name="created_at") private Instant createdAt;
 @Column(name="updated_at") private Instant updatedAt; @Version private long version;
 protected Organization(){}
 public Organization(UUID id,String name,String slug,String legalName,String locale,String timezone,String currency){this.id=Objects.requireNonNull(id);this.name=required(name,160);this.slug=normalizeSlug(slug);this.legalName=legalName;this.defaultLocale=Locale.forLanguageTag(required(locale,16)).toLanguageTag();if(this.defaultLocale.isBlank())throw new IllegalArgumentException("invalid locale");this.defaultTimezone=ZoneId.of(timezone).getId();this.defaultCurrency=Currency.getInstance(currency.toUpperCase(Locale.ROOT)).getCurrencyCode();this.status=Status.ACTIVE;this.createdAt=Instant.now();this.updatedAt=createdAt;}
 public void update(String name,String legalName,String locale,String timezone,String currency){this.name=required(name,160);this.legalName=legalName;this.defaultLocale=Locale.forLanguageTag(locale).toLanguageTag();this.defaultTimezone=ZoneId.of(timezone).getId();this.defaultCurrency=Currency.getInstance(currency.toUpperCase(Locale.ROOT)).getCurrencyCode();this.updatedAt=Instant.now();}
 private static String required(String v,int max){if(v==null||v.isBlank()||v.length()>max)throw new IllegalArgumentException("invalid value");return v.trim();}
 static String normalizeSlug(String v){String s=required(v,80).trim().toLowerCase(Locale.ROOT);if(!s.matches("[a-z0-9]+(?:-[a-z0-9]+)*"))throw new IllegalArgumentException("invalid slug");return s;}
 public UUID id(){return id;} public String name(){return name;} public String slug(){return slug;} public String legalName(){return legalName;} public String locale(){return defaultLocale;} public String timezone(){return defaultTimezone;} public String currency(){return defaultCurrency;} public Status status(){return status;} public long version(){return version;} public Instant createdAt(){return createdAt;} public Instant updatedAt(){return updatedAt;}
 public enum Status{ACTIVE,SUSPENDED,ARCHIVED}
}
