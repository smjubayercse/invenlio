CREATE TABLE foundation_metadata (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    schema_generation INTEGER NOT NULL CHECK (schema_generation > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

INSERT INTO foundation_metadata (id, schema_generation) VALUES (1, 1);

COMMENT ON TABLE foundation_metadata IS 'Tracks the installed Invenlio foundation schema generation.';

