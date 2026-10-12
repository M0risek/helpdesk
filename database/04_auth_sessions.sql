CREATE TABLE helpdesk.auth_sessions (
    session_id VARCHAR2(128 CHAR) NOT NULL,
    session_data CLOB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_auth_sessions PRIMARY KEY (session_id)
);

CREATE INDEX helpdesk.idx_auth_sessions_expiry ON helpdesk.auth_sessions (expires_at);
