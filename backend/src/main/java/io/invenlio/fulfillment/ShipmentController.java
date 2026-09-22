package io.invenlio.fulfillment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shipments")
@SecurityRequirement(name="bearerAuth")
class ShipmentController {
    private final ShipmentService service;
    ShipmentController(ShipmentService service) { this.service=service; }

    @Operation(summary="Create draft shipment from already packed packages")
    @PostMapping
    ShipmentService.Shipment create(@Valid @RequestBody Create request) {
        return service.create(new ShipmentService.Create(request.salesOrderId(),request.packageIds(),
            request.carrierName(),request.serviceName(),request.trackingNumber()));
    }
    @Operation(summary="List tenant shipments with bounded filters and sorting")
    @GetMapping
    List<ShipmentService.Shipment> list(@RequestParam(required=false) String shipmentNumber,
        @RequestParam(required=false) UUID salesOrderId,@RequestParam(required=false) UUID warehouseId,
        @RequestParam(required=false) String status,@RequestParam(required=false) String carrierName,
        @RequestParam(required=false) String trackingNumber,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) Instant dispatchedFrom,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) Instant dispatchedTo,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(required=false) String sort) {
        return service.list(shipmentNumber,salesOrderId,warehouseId,status,carrierName,trackingNumber,
            dispatchedFrom,dispatchedTo,page,size,sort);
    }
    @Operation(summary="Get a shipment")
    @GetMapping("/{id}")
    ShipmentService.Shipment get(@PathVariable UUID id) { return service.get(id); }
    @Operation(summary="Update manual carrier and tracking details on a draft shipment")
    @PatchMapping("/{id}")
    ShipmentService.Shipment update(@PathVariable UUID id,@Valid @RequestBody Update request) {
        return service.update(id,new ShipmentService.Update(request.carrierName(),request.serviceName(),
            request.trackingNumber(),request.version()));
    }
    @Operation(summary="Atomically dispatch packed contents out of company inventory")
    @PostMapping("/{id}/dispatch")
    ShipmentService.Shipment dispatch(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key) {
        return service.dispatch(id,key);
    }
    @Operation(summary="Cancel an undispatched draft shipment")
    @PostMapping("/{id}/cancel")
    ShipmentService.Shipment cancel(@PathVariable UUID id,@Valid @RequestBody Version request) {
        return service.cancel(id,request.version());
    }
    record Create(@NotNull UUID salesOrderId,@NotEmpty List<@NotNull UUID> packageIds,
                  String carrierName,String serviceName,String trackingNumber) {}
    record Update(String carrierName,String serviceName,String trackingNumber,@PositiveOrZero long version) {}
    record Version(@PositiveOrZero long version) {}
}
