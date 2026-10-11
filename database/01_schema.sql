
CREATE TABLE helpdesk.users (
    id NUMBER GENERATED ALWAYS AS IDENTITY,
    full_name VARCHAR2(120 CHAR) NOT NULL,
    email VARCHAR2(254 CHAR) NOT NULL,
    password_hash VARCHAR2(255 CHAR) NOT NULL,
    user_role VARCHAR2(10 CHAR) DEFAULT 'CLIENT' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email CHECK (TRIM(email) IS NOT NULL AND email = LOWER(TRIM(email))),
    CONSTRAINT ck_users_role CHECK (user_role IN ('CLIENT', 'STAFF'))
);

CREATE TABLE helpdesk.categories (
    id NUMBER GENERATED ALWAYS AS IDENTITY,
    name VARCHAR2(80 CHAR) NOT NULL,
    description VARCHAR2(400 CHAR),

    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TABLE helpdesk.tickets (
    id NUMBER GENERATED ALWAYS AS IDENTITY,
    title VARCHAR2(200 CHAR) NOT NULL,
    description CLOB NOT NULL,
    category_id NUMBER NOT NULL,
    client_id NUMBER NOT NULL,
    assigned_to NUMBER,
    status VARCHAR2(20 CHAR) DEFAULT 'NEW' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_tickets PRIMARY KEY (id),
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id)
        REFERENCES helpdesk.categories (id),
    CONSTRAINT fk_tickets_client FOREIGN KEY (client_id)
        REFERENCES helpdesk.users (id),
    CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to)
        REFERENCES helpdesk.users (id),
    CONSTRAINT ck_tickets_status CHECK (
        status IN ('NEW', 'IN_PROGRESS', 'CLOSED')
    ),
    CONSTRAINT ck_tickets_assignment CHECK (
        status = 'NEW' OR assigned_to IS NOT NULL
    )
);

CREATE INDEX helpdesk.idx_tickets_category
    ON helpdesk.tickets (category_id);

CREATE INDEX helpdesk.idx_tickets_client
    ON helpdesk.tickets (client_id);

CREATE INDEX helpdesk.idx_tickets_assigned
    ON helpdesk.tickets (assigned_to);

COMMENT ON TABLE helpdesk.users IS 'Konta klientow i pracownikow serwisu';
COMMENT ON TABLE helpdesk.categories IS 'Kategorie sprzetu w zgloszeniach';
COMMENT ON TABLE helpdesk.tickets IS 'Zgloszenia klientow i status realizacji';
