"""Additive relational projections; JSON packages remain backwards compatible."""


def migrate(db):
    db.execute('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    if db.execute('SELECT 1 FROM schema_migrations WHERE version=1').fetchone():
        audit_legacy(db)
        enforce_reference_types(db)
        conversation_provenance(db)
        return
    db.executescript('''
        CREATE TABLE IF NOT EXISTS package_sources(
            tenant TEXT NOT NULL,package_id TEXT NOT NULL,document_id TEXT NOT NULL,
            PRIMARY KEY(tenant,package_id,document_id),
            FOREIGN KEY(tenant,package_id) REFERENCES packages(tenant,id) ON DELETE CASCADE,
            FOREIGN KEY(tenant,document_id) REFERENCES documents(tenant,id) ON DELETE RESTRICT);
        CREATE INDEX IF NOT EXISTS package_sources_by_document ON package_sources(tenant,document_id,package_id);
        INSERT OR IGNORE INTO package_sources
            SELECT p.tenant,p.id,j.value FROM packages p,json_each(p.input,'$.document_ids') j
            JOIN documents d ON d.tenant=p.tenant AND d.id=j.value;
        CREATE TRIGGER IF NOT EXISTS package_source_shape_insert BEFORE INSERT ON packages BEGIN
            SELECT CASE WHEN COALESCE(json_type(NEW.input,'$.document_ids'),'')<>'array' OR COALESCE(json_array_length(NEW.input,'$.document_ids'),0) NOT BETWEEN 1 AND 8 THEN RAISE(ABORT,'Pacote exige de uma a oito fontes') END;
        END;
        CREATE TRIGGER IF NOT EXISTS package_source_shape_update BEFORE UPDATE OF input ON packages BEGIN
            SELECT CASE WHEN COALESCE(json_type(NEW.input,'$.document_ids'),'')<>'array' OR COALESCE(json_array_length(NEW.input,'$.document_ids'),0) NOT BETWEEN 1 AND 8 THEN RAISE(ABORT,'Pacote exige de uma a oito fontes') END;
        END;
        CREATE TRIGGER IF NOT EXISTS package_sources_insert AFTER INSERT ON packages BEGIN
            INSERT OR IGNORE INTO package_sources SELECT NEW.tenant,NEW.id,value FROM json_each(NEW.input,'$.document_ids');
        END;
        CREATE TRIGGER IF NOT EXISTS package_sources_update AFTER UPDATE OF input ON packages BEGIN
            DELETE FROM package_sources WHERE tenant=NEW.tenant AND package_id=NEW.id;
            INSERT OR IGNORE INTO package_sources SELECT NEW.tenant,NEW.id,value FROM json_each(NEW.input,'$.document_ids');
        END;
        CREATE INDEX IF NOT EXISTS documents_by_hash ON documents(tenant,hash);
        CREATE INDEX IF NOT EXISTS attempts_by_package ON quiz_attempts(tenant,package_id);
        INSERT OR IGNORE INTO schema_migrations(version) VALUES(1);
    ''')

    audit_legacy(db)
    enforce_reference_types(db)
    conversation_provenance(db)


def audit_legacy(db):
    if db.execute('SELECT 1 FROM schema_migrations WHERE version=2').fetchone():
        return
    db.executescript('''
        CREATE TABLE IF NOT EXISTS package_integrity_issues(
            tenant TEXT NOT NULL,package_id TEXT NOT NULL,document_id TEXT NOT NULL,
            PRIMARY KEY(tenant,package_id,document_id),
            FOREIGN KEY(tenant,package_id) REFERENCES packages(tenant,id) ON DELETE CASCADE);
        INSERT OR IGNORE INTO package_integrity_issues
            SELECT p.tenant,p.id,j.value FROM packages p,json_each(p.input,'$.document_ids') j
            LEFT JOIN documents d ON d.tenant=p.tenant AND d.id=j.value WHERE d.id IS NULL;
        INSERT OR IGNORE INTO package_integrity_issues
            SELECT tenant,id,'__missing_document_refs__' FROM packages
            WHERE COALESCE(json_type(input,'$.document_ids'),'')<>'array' OR COALESCE(json_array_length(input,'$.document_ids'),0) NOT BETWEEN 1 AND 8;
        CREATE TRIGGER IF NOT EXISTS package_integrity_repaired AFTER UPDATE OF input ON packages BEGIN
            DELETE FROM package_integrity_issues WHERE tenant=NEW.tenant AND package_id=NEW.id;
        END;
        INSERT OR IGNORE INTO schema_migrations(version) VALUES(2);
    ''')


def enforce_reference_types(db):
    """Version 3 also repairs the v2 inventory's NULL blind spot without data loss."""
    if db.execute('SELECT 1 FROM schema_migrations WHERE version=3').fetchone():
        return
    db.executescript('''
        INSERT OR IGNORE INTO package_integrity_issues
            SELECT p.tenant,p.id,'__invalid_document_ref_' || j.key || '__'
            FROM packages p,json_each(p.input,'$.document_ids') j
            WHERE j.type<>'text' OR length(trim(j.value))=0;
        DROP TRIGGER IF EXISTS package_source_shape_insert;
        DROP TRIGGER IF EXISTS package_source_shape_update;
    ''')
    for event in ('INSERT', 'UPDATE OF input'):
        name = 'insert' if event == 'INSERT' else 'update'
        db.execute(f'''CREATE TRIGGER package_source_shape_{name} BEFORE {event} ON packages BEGIN
            SELECT CASE WHEN COALESCE(json_type(NEW.input,'$.document_ids'),'')<>'array'
                OR COALESCE(json_array_length(NEW.input,'$.document_ids'),0) NOT BETWEEN 1 AND 8
                OR EXISTS(SELECT 1 FROM json_each(NEW.input,'$.document_ids') WHERE type<>'text' OR length(trim(value))=0)
                THEN RAISE(ABORT,'Pacote exige de uma a oito fontes textuais válidas') END;
        END''')
    db.execute('INSERT INTO schema_migrations(version) VALUES(3)')


def ensure_integrity(db, tenant):
    from ..providers import ProviderIntegrity
    if db.execute('SELECT 1 FROM package_integrity_issues WHERE tenant=? LIMIT 1',(tenant,)).fetchone() or unscoped_context(db,tenant):
        raise ProviderIntegrity('Há materiais antigos com referências inconsistentes. Solicite reconciliação antes de gerar ou remover fontes.')


def conversation_provenance(db):
    if db.execute('SELECT 1 FROM schema_migrations WHERE version=4').fetchone():
        return
    db.executescript('''
        CREATE TABLE IF NOT EXISTS conversation_sources(
            tenant TEXT NOT NULL,turn_id TEXT NOT NULL,document_id TEXT NOT NULL,
            PRIMARY KEY(tenant,turn_id,document_id),
            FOREIGN KEY(tenant,turn_id) REFERENCES conversations(tenant,id) ON DELETE CASCADE,
            FOREIGN KEY(tenant,document_id) REFERENCES documents(tenant,id) ON DELETE CASCADE);
        INSERT OR IGNORE INTO package_integrity_issues
            SELECT tenant,id,'__unscoped_conversation_context__' FROM packages
            WHERE json_type(input,'$.conversation_context')='text'
            AND length(json_extract(input,'$.conversation_context'))>0;
        INSERT INTO schema_migrations(version) VALUES(4);
    ''')


def unscoped_context(db,tenant,package_id=None):
    return db.execute("""SELECT 1 FROM packages WHERE tenant=?
        AND (? IS NULL OR id=?) AND json_type(input,'$.conversation_context')='text'
        AND length(json_extract(input,'$.conversation_context'))>0 LIMIT 1""",
        (tenant,package_id,package_id)).fetchone() is not None
