\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  missing_tables text;
BEGIN
  SELECT string_agg(expected.table_name, ', ' ORDER BY expected.table_name)
  INTO missing_tables
  FROM unnest(ARRAY[
    'audit_events',
    'communities',
    'community_memberships',
    'community_positions',
    'community_roles',
    'financial_categories',
    'financial_report_approvals',
    'financial_report_entries',
    'financial_report_publication_snapshots',
    'financial_reports',
    'houses',
    'membership_position_assignments',
    'membership_roles',
    'permissions',
    'platform_roles',
    'publications',
    'residencies',
    'residents',
    'role_permissions',
    'user_platform_roles',
    'users'
  ]) AS expected(table_name)
  WHERE to_regclass('public.' || expected.table_name) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing application tables: %', missing_tables;
  END IF;
END $$;

DO $$
DECLARE
  missing_columns text;
BEGIN
  SELECT string_agg(expected.table_name || '.' || expected.column_name, ', ' ORDER BY 1)
  INTO missing_columns
  FROM (VALUES
    ('communities', 'created_by_user_id'),
    ('communities', 'updated_by_user_id'),
    ('users', 'created_by_user_id'),
    ('users', 'updated_by_user_id'),
    ('permissions', 'created_by_user_id'),
    ('permissions', 'updated_by_user_id'),
    ('platform_roles', 'created_by_user_id'),
    ('platform_roles', 'updated_by_user_id'),
    ('community_memberships', 'created_by_membership_id'),
    ('community_memberships', 'updated_by_membership_id'),
    ('community_positions', 'created_by_membership_id'),
    ('community_positions', 'updated_by_membership_id'),
    ('community_roles', 'created_by_membership_id'),
    ('community_roles', 'updated_by_membership_id'),
    ('houses', 'created_by_membership_id'),
    ('houses', 'updated_by_membership_id'),
    ('residents', 'created_by_membership_id'),
    ('residents', 'updated_by_membership_id'),
    ('residencies', 'created_by_membership_id'),
    ('residencies', 'updated_by_membership_id'),
    ('financial_categories', 'created_by_membership_id'),
    ('financial_categories', 'updated_by_membership_id'),
    ('financial_reports', 'created_by_membership_id'),
    ('financial_reports', 'updated_by_membership_id'),
    ('financial_report_entries', 'created_by_membership_id'),
    ('financial_report_entries', 'updated_by_membership_id')
  ) AS expected(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns columns
    WHERE columns.table_schema = 'public'
      AND columns.table_name = expected.table_name
      AND columns.column_name = expected.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Missing actor columns: %', missing_columns;
  END IF;
END $$;

DO $$
DECLARE
  mutable_table text;
BEGIN
  FOREACH mutable_table IN ARRAY ARRAY[
    'communities',
    'users',
    'community_memberships',
    'community_positions',
    'community_roles',
    'permissions',
    'platform_roles',
    'houses',
    'residents',
    'residencies',
    'financial_categories',
    'financial_reports',
    'financial_report_entries'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns columns
      WHERE columns.table_schema = 'public'
        AND columns.table_name = mutable_table
        AND columns.column_name IN ('created_date_time', 'updated_date_time', 'status')
      GROUP BY columns.table_name
      HAVING count(*) = 3
    ) THEN
      RAISE EXCEPTION 'Missing lifecycle columns on %', mutable_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraints
      WHERE constraints.conrelid = ('public.' || mutable_table)::regclass
        AND constraints.conname = mutable_table || '_status_check'
        AND constraints.contype = 'c'
    ) THEN
      RAISE EXCEPTION 'Missing lifecycle constraint on %', mutable_table;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  forbidden_columns text;
BEGIN
  SELECT string_agg(columns.table_name || '.' || columns.column_name, ', ' ORDER BY 1)
  INTO forbidden_columns
  FROM information_schema.columns columns
  WHERE columns.table_schema = 'public'
    AND columns.table_name IN (
      'audit_events',
      'financial_report_approvals',
      'financial_report_publication_snapshots',
      'publications'
    )
    AND (
      columns.column_name IN ('status', 'updated_date_time')
      OR columns.column_name LIKE 'updated_by_%'
    );

  IF forbidden_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Immutable tables contain mutable columns: %', forbidden_columns;
  END IF;
END $$;

INSERT INTO communities (id, name, slug)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Community A', 'community-a'),
  ('00000000-0000-4000-8000-000000000002', 'Community B', 'community-b');

INSERT INTO users (id, email, normalized_email)
VALUES
  ('00000000-0000-4000-8000-000000000101', 'admin-a@example.test', 'admin-a@example.test'),
  ('00000000-0000-4000-8000-000000000102', 'admin-b@example.test', 'admin-b@example.test'),
  ('00000000-0000-4000-8000-000000000103', 'officer-a@example.test', 'officer-a@example.test');

INSERT INTO community_memberships (id, community_id, user_id)
VALUES
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000102'
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000103'
  );

DO $$
BEGIN
  BEGIN
    INSERT INTO community_memberships (id, community_id, user_id)
    VALUES (
      '00000000-0000-4000-8000-000000000204',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000101'
    );
    RAISE EXCEPTION 'A user was allowed to join multiple communities';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;
END $$;

INSERT INTO community_positions (id, community_id, code, name)
VALUES (
  '00000000-0000-4000-8000-000000000211',
  '00000000-0000-4000-8000-000000000001',
  'PAK_RT',
  'Pak RT'
);

INSERT INTO membership_position_assignments (
  id,
  community_id,
  membership_id,
  position_id,
  created_by_membership_id
)
VALUES (
  '00000000-0000-4000-8000-000000000212',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000211',
  '00000000-0000-4000-8000-000000000201'
);

INSERT INTO houses (id, community_id, code, address_line)
VALUES
  (
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000001',
    'A-01',
    'Community A House 1'
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000001',
    'A-02',
    'Community A House 2'
  ),
  (
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000002',
    'B-01',
    'Community B House 1'
  );

DO $$
BEGIN
  BEGIN
    INSERT INTO houses (id, community_id, code, address_line, status)
    VALUES (
      '00000000-0000-4000-8000-000000000304',
      '00000000-0000-4000-8000-000000000001',
      'A-03',
      'Invalid lifecycle house',
      4
    );
    RAISE EXCEPTION 'Invalid lifecycle status was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO residents (id, community_id, full_name)
VALUES
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000001',
    'Resident A1'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000001',
    'Resident A2'
  );

DO $$
BEGIN
  BEGIN
    INSERT INTO residencies (id, community_id, resident_id, house_id, residency_type, start_date)
    VALUES (
      '00000000-0000-4000-8000-000000000501',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000401',
      '00000000-0000-4000-8000-000000000303',
      'PERMANENT',
      DATE '2026-01-01'
    );
    RAISE EXCEPTION 'Cross-community residency was accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;
END $$;

INSERT INTO residencies (id, community_id, resident_id, house_id, residency_type, start_date)
VALUES (
  '00000000-0000-4000-8000-000000000502',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000301',
  'PERMANENT',
  DATE '2026-01-01'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO residencies (id, community_id, resident_id, house_id, residency_type, start_date)
    VALUES (
      '00000000-0000-4000-8000-000000000503',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000401',
      '00000000-0000-4000-8000-000000000302',
      'TEMPORARY',
      DATE '2026-02-01'
    );
    RAISE EXCEPTION 'Multiple active residencies were accepted';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO residencies (
      id,
      community_id,
      resident_id,
      house_id,
      residency_type,
      start_date,
      end_date
    )
    VALUES (
      '00000000-0000-4000-8000-000000000504',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000402',
      '00000000-0000-4000-8000-000000000302',
      'PERMANENT',
      DATE '2026-02-01',
      DATE '2026-01-31'
    );
    RAISE EXCEPTION 'Invalid residency date range was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO financial_categories (id, community_id, code, name, entry_type)
VALUES (
  '00000000-0000-4000-8000-000000000601',
  '00000000-0000-4000-8000-000000000001',
  'DUES',
  'Resident dues',
  'INCOME'
);

INSERT INTO financial_reports (
  id,
  community_id,
  period_start,
  period_end,
  revision_number,
  opening_balance_minor,
  currency,
  workflow_stage
)
VALUES
  (
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000000001',
    DATE '2026-01-01',
    DATE '2026-01-31',
    1,
    0,
    'IDR',
    'DRAFT'
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000000001',
    DATE '2026-01-01',
    DATE '2026-01-31',
    2,
    0,
    'IDR',
    'DRAFT'
  );

UPDATE financial_reports
SET supersedes_report_id = '00000000-0000-4000-8000-000000000701'
WHERE id = '00000000-0000-4000-8000-000000000702';

DO $$
BEGIN
  BEGIN
    INSERT INTO financial_report_entries (
      id,
      community_id,
      report_id,
      category_id,
      entry_type,
      transaction_date,
      description,
      amount_minor
    )
    VALUES (
      '00000000-0000-4000-8000-000000000801',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000701',
      '00000000-0000-4000-8000-000000000601',
      'INCOME',
      DATE '2026-01-10',
      'Invalid amount',
      0
    );
    RAISE EXCEPTION 'Non-positive financial amount was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO financial_report_entries (
      id,
      community_id,
      report_id,
      category_id,
      entry_type,
      transaction_date,
      description,
      amount_minor
    )
    VALUES (
      '00000000-0000-4000-8000-000000000802',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000701',
      '00000000-0000-4000-8000-000000000601',
      'EXPENSE',
      DATE '2026-01-10',
      'Mismatched category type',
      1000
    );
    RAISE EXCEPTION 'Financial entry type disagreed with its category';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO financial_reports (
      id,
      community_id,
      period_start,
      period_end,
      revision_number,
      opening_balance_minor,
      currency,
      workflow_stage,
      supersedes_report_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000703',
      '00000000-0000-4000-8000-000000000001',
      DATE '2026-01-01',
      DATE '2026-01-31',
      3,
      0,
      'IDR',
      'DRAFT',
      '00000000-0000-4000-8000-000000000701'
    );
    RAISE EXCEPTION 'Branched financial revision history was accepted';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO financial_reports (
      id,
      community_id,
      period_start,
      period_end,
      revision_number,
      opening_balance_minor,
      currency,
      workflow_stage,
      supersedes_report_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000704',
      '00000000-0000-4000-8000-000000000002',
      DATE '2026-01-01',
      DATE '2026-01-31',
      1,
      0,
      'IDR',
      'DRAFT',
      '00000000-0000-4000-8000-000000000701'
    );
    RAISE EXCEPTION 'Cross-community financial supersession was accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO financial_reports (
      id,
      community_id,
      period_start,
      period_end,
      revision_number,
      opening_balance_minor,
      currency,
      workflow_stage,
      supersedes_report_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000705',
      '00000000-0000-4000-8000-000000000001',
      DATE '2026-02-01',
      DATE '2026-02-28',
      1,
      0,
      'IDR',
      'DRAFT',
      '00000000-0000-4000-8000-000000000702'
    );
    RAISE EXCEPTION 'A financial revision crossed reporting periods';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO financial_report_approvals (
      id,
      community_id,
      report_id,
      position_assignment_id,
      decision,
      created_by_membership_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000706',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000701',
      '00000000-0000-4000-8000-000000000212',
      'APPROVED',
      '00000000-0000-4000-8000-000000000201'
    );
    RAISE EXCEPTION 'Approval used another membership position assignment';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;
END $$;

INSERT INTO publications (
  id,
  community_id,
  series_id,
  public_id,
  publication_type,
  revision_number,
  created_by_membership_id
)
VALUES
  (
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000911',
    'publication-a-1',
    'FINANCIAL_REPORT',
    1,
    '00000000-0000-4000-8000-000000000201'
  ),
  (
    '00000000-0000-4000-8000-000000000902',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000911',
    'publication-a-2',
    'FINANCIAL_REPORT',
    2,
    '00000000-0000-4000-8000-000000000201'
  );

UPDATE publications
SET supersedes_publication_id = '00000000-0000-4000-8000-000000000901'
WHERE id = '00000000-0000-4000-8000-000000000902';

INSERT INTO publications (
  id,
  community_id,
  series_id,
  public_id,
  publication_type,
  revision_number,
  created_by_membership_id
)
VALUES (
  '00000000-0000-4000-8000-000000000905',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000912',
  'publication-a-independent-1',
  'FINANCIAL_REPORT',
  1,
  '00000000-0000-4000-8000-000000000201'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO publications (
      id,
      community_id,
      series_id,
      public_id,
      publication_type,
      revision_number,
      supersedes_publication_id,
      created_by_membership_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000903',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000911',
      'publication-a-3',
      'FINANCIAL_REPORT',
      3,
      '00000000-0000-4000-8000-000000000901',
      '00000000-0000-4000-8000-000000000201'
    );
    RAISE EXCEPTION 'Branched publication history was accepted';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO publications (
      id,
      community_id,
      series_id,
      public_id,
      publication_type,
      revision_number,
      supersedes_publication_id,
      created_by_membership_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000904',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000913',
      'publication-b-1',
      'FINANCIAL_REPORT',
      1,
      '00000000-0000-4000-8000-000000000901',
      '00000000-0000-4000-8000-000000000202'
    );
    RAISE EXCEPTION 'Cross-community publication supersession was accepted';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO publications (
      id,
      community_id,
      series_id,
      public_id,
      publication_type,
      revision_number,
      supersedes_publication_id,
      created_by_membership_id
    )
    VALUES (
      '00000000-0000-4000-8000-000000000906',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000912',
      'publication-a-independent-2',
      'FINANCIAL_REPORT',
      2,
      '00000000-0000-4000-8000-000000000902',
      '00000000-0000-4000-8000-000000000201'
    );
    RAISE EXCEPTION 'Publication supersession crossed publication series';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;
END $$;

ROLLBACK;
