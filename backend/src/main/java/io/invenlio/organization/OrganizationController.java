package io.invenlio.organization;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.time.*; import java.util.*; import org.springframework.data.domain.*; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1") class OrganizationController {
 private final OrganizationAdministrationService service; OrganizationController(OrganizationAdministrationService s){service=s;}
 @GetMapping("/organization") OrgResponse organization(){return OrgResponse.of(service.current());}
 @PatchMapping("/organization") OrgResponse update(@Valid @RequestBody UpdateOrganization r){return OrgResponse.of(service.update(r.name,r.legalName,r.locale,r.timezone,r.currency,r.version));}
 @GetMapping("/members") Page<MemberResponse> members(@RequestParam(defaultValue="0")@Min(0)int page,@RequestParam(defaultValue="20")@Min(1)@Max(100)int size){return service.members(PageRequest.of(page,size)).map(MemberResponse::of);}
 @PostMapping("/members/invitations") @ResponseStatus(HttpStatus.CREATED) MemberResponse invite(@Valid @RequestBody InviteMember r){return MemberResponse.of(service.invite(r.userIdentityId));}
 @PatchMapping("/members/{id}") MemberResponse change(@PathVariable UUID id,@Valid @RequestBody ChangeMember r){return MemberResponse.of(service.changeMember(id,r.status,r.version));}
 @GetMapping("/roles") List<RoleResponse> roles(){return service.roles().stream().map(RoleResponse::of).toList();}
 @PostMapping("/roles") @ResponseStatus(HttpStatus.CREATED) RoleResponse role(@Valid @RequestBody CreateRole r){return RoleResponse.of(service.createRole(r.name,r.permissions));}
 @PostMapping("/members/{memberId}/roles/{roleId}") @ResponseStatus(HttpStatus.NO_CONTENT) void assign(@PathVariable UUID memberId,@PathVariable UUID roleId){service.assign(memberId,roleId);}
 @GetMapping("/audit-events") Page<AuditResponse> audit(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")@Max(100)int size,@RequestParam(defaultValue="1970-01-01T00:00:00Z")Instant from,@RequestParam(defaultValue="9999-12-31T23:59:59Z")Instant to){return service.audit(PageRequest.of(page,size,Sort.by(Sort.Direction.DESC,"occurredAt")),from,to).map(AuditResponse::of);}
 record UpdateOrganization(@NotBlank @Size(max=160)String name,@Size(max=200)String legalName,@NotBlank String locale,@NotBlank String timezone,@Pattern(regexp="[A-Z]{3}")String currency,@PositiveOrZero long version){}
 record InviteMember(@NotNull UUID userIdentityId){} record ChangeMember(@Pattern(regexp="ACTIVE|SUSPENDED|REMOVED")String status,@PositiveOrZero long version){} record CreateRole(@Pattern(regexp="[A-Z][A-Z0-9_]{2,79}")String name,@NotEmpty Set<String> permissions){}
 record OrgResponse(UUID id,String name,String slug,String legalName,String status,String locale,String timezone,String currency,long version,Instant createdAt,Instant updatedAt){static OrgResponse of(Organization o){return new OrgResponse(o.id(),o.name(),o.slug(),o.legalName(),o.status().name(),o.locale(),o.timezone(),o.currency(),o.version(),o.createdAt(),o.updatedAt());}}
 record MemberResponse(UUID id,UUID userIdentityId,String status,long version,Instant createdAt,Instant updatedAt){static MemberResponse of(OrganizationMembership m){return new MemberResponse(m.id(),m.userIdentityId(),m.status().name(),m.version(),m.createdAt(),m.updatedAt());}}
 record RoleResponse(UUID id,String name,boolean systemRole,long version){static RoleResponse of(Role r){return new RoleResponse(r.id(),r.name(),r.systemRole(),r.version());}}
 record AuditResponse(UUID id,String actor,String action,String entityType,String entityId,Instant occurredAt,String correlationId){static AuditResponse of(AuditEvent e){return new AuditResponse(e.id(),e.actor(),e.action(),e.entityType(),e.entityId(),e.at(),e.correlation());}}
}

