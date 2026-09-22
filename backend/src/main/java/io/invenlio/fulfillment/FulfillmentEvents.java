package io.invenlio.fulfillment;

import java.util.UUID;

/** In-process events for downstream projections and the TASK-013 shipping handoff. */
public final class FulfillmentEvents {
    private FulfillmentEvents() {}

    public record PickTaskCompleted(UUID tenantId, UUID pickListId, UUID taskId, UUID movementId) {}
    public record PickListCompleted(UUID tenantId, UUID pickListId, UUID salesOrderId) {}
    public record PackingCompleted(UUID tenantId, UUID packingSessionId, UUID salesOrderId) {}
}
