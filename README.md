-- BẬT EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------
-- 1. AUTH & RBAC (1 USER = 1 ROLE)
--------------------------------------------------

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT UNIQUE NOT NULL, -- ADMIN / STAFF / USER ...
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    phone_number    TEXT,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status          TEXT NOT NULL DEFAULT 'active', -- active / disabled / pending
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    CONSTRAINT users_status_chk 
        CHECK (status IN ('active','disabled','pending'))
);

CREATE INDEX idx_users_role ON users(role_id);

--------------------------------------------------
-- 2. HỒ SƠ BỆNH NHÂN & CHIA SẺ
--------------------------------------------------

CREATE TABLE patient_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name               TEXT NOT NULL,
    date_of_birth           DATE,
    sex                     TEXT,  -- male/female/other/...
    relationship_to_owner   TEXT,  -- self, father, mother, child, ...
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profile_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL, -- owner / caregiver / viewer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, user_id),
    CONSTRAINT profile_shares_role_chk 
        CHECK (role IN ('owner','caregiver','viewer'))
);

--------------------------------------------------
-- 3. THUỐC & DỮ LIỆU THAM CHIẾU
--------------------------------------------------

CREATE TABLE ref_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    url             TEXT,
    description     TEXT,
    license_info    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE substances (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,       -- tên hoạt chất, vd: Paracetamol
    atc_code         TEXT,                -- mã ATC nếu có

    title            TEXT,                -- tiêu đề, vd: "Paracetamol – thuốc giảm đau, hạ sốt"
    summary          TEXT,                -- mô tả ngắn
    indications      TEXT,                -- chỉ định
    warnings         TEXT,                -- cảnh báo
    side_effects     TEXT,                -- tác dụng phụ thường gặp
    usual_dose_text  TEXT,                -- liều dùng tham khảo

    source_id        UUID REFERENCES ref_sources(id), -- lấy từ nguồn nào
    last_reviewed_at TIMESTAMPTZ,        -- lần cuối nội dung được review

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX substances_name_idx 
    ON substances (LOWER(name));

CREATE TABLE drug_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name      TEXT NOT NULL,       -- tên thương mại
    form            TEXT,                -- viên nén, capsule, sirô...
    route           TEXT,                -- oral, injection...
    strength_text   TEXT,                -- "500 mg", "5 mg/ml"
    manufacturer    TEXT,
    country         TEXT,
    is_generic      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX drug_products_brand_name_idx 
    ON drug_products (LOWER(brand_name));

CREATE TABLE product_substances (
    product_id      UUID NOT NULL REFERENCES drug_products(id) ON DELETE CASCADE,
    substance_id    UUID NOT NULL REFERENCES substances(id) ON DELETE RESTRICT,
    strength_value  NUMERIC(10,3),
    strength_unit   TEXT,                -- mg, g, IU...
    PRIMARY KEY (product_id, substance_id)
);

CREATE TABLE drug_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    substance_id_1  UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    substance_id_2  UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    severity        TEXT NOT NULL,    -- 'mild', 'moderate', 'severe' / 'contraindicated'
    description     TEXT,             -- Mô tả rủi ro (VD: Nguy cơ chảy máu...)
    management      TEXT,             -- Gợi ý xử lý tham khảo
    source_id       UUID REFERENCES ref_sources(id), 
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_interaction_pair UNIQUE (substance_id_1, substance_id_2) 
);

--------------------------------------------------
-- 4. ĐƠN THUỐC, LỊCH DÙNG & UỐNG THUỐC
--------------------------------------------------

CREATE TABLE prescriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id           UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    prescriber_name      TEXT,        -- tên bác sĩ
    prescriber_specialty TEXT,
    facility_name        TEXT,        -- tên cơ sở khám
    issued_date          DATE,
    note                 TEXT,
    source_type          TEXT NOT NULL DEFAULT 'manual', -- manual / scan
    status               TEXT NOT NULL DEFAULT 'active', -- active / completed / cancelled
    created_by_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT prescriptions_status_chk 
        CHECK (status IN ('active','completed','cancelled')),
    CONSTRAINT prescriptions_source_type_chk
        CHECK (source_type IN ('manual','scan'))
);

CREATE TABLE prescription_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id         UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    original_name_text      TEXT NOT NULL,  -- tên thuốc như trên toa
    original_instructions   TEXT,           -- hướng dẫn gốc trên toa
    drug_product_id         UUID REFERENCES drug_products(id),
    substance_id            UUID REFERENCES substances(id),
    dose_amount             NUMERIC(10,3),
    dose_unit               TEXT,
    frequency_text          TEXT,          -- "3 lần/ngày", "mỗi 8h"...
    route                   TEXT,	
    duration_days           INTEGER,
    start_date              DATE,
    end_date                DATE,
    is_prn                  BOOLEAN NOT NULL DEFAULT FALSE,
    notes                   TEXT
);

CREATE TABLE prescription_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,
    file_type       TEXT NOT NULL,      -- image / pdf / other
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medication_regimens (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id              UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    prescription_item_id    UUID REFERENCES prescription_items(id) ON DELETE SET NULL,
    drug_product_id         UUID REFERENCES drug_products(id),

    display_name            TEXT NOT NULL,         -- tên hiển thị cho user
    total_daily_dose        NUMERIC(10,3),
    dose_unit               TEXT,
    start_date              DATE,
    end_date                DATE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    schedule_type           TEXT NOT NULL DEFAULT 'fixed_times',  -- fixed_times / interval_hours / custom...
    schedule_payload        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- chi tiết giờ uống / pattern
    timezone                TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',

    created_by_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT med_regimen_schedule_type_chk
        CHECK (schedule_type IN ('fixed_times','interval_hours','custom'))
);

CREATE TABLE medication_intake_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regimen_id          UUID NOT NULL REFERENCES medication_regimens(id) ON DELETE CASCADE,
    profile_id          UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    scheduled_time      TIMESTAMPTZ,
    taken_time          TIMESTAMPTZ,
    status              TEXT NOT NULL,    -- taken / skipped / delayed / unknown
    dose_amount_taken   NUMERIC(10,3),
    notes               TEXT,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT intake_status_chk 
        CHECK (status IN ('taken','skipped','delayed','unknown'))
);

--------------------------------------------------
-- 5. NHẬT KÝ TRIỆU CHỨNG & LIÊN KẾT THUỐC
--------------------------------------------------

CREATE TABLE symptom_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    recorded_at         TIMESTAMPTZ NOT NULL,
    symptom_name        TEXT NOT NULL,    -- "đau đầu", "buồn nôn", ...
    severity_score      INTEGER,          -- 0–10
    relation_to_med     TEXT,             -- before_medication / after_medication / unknown
    description         TEXT,
    notes               TEXT,
    created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT severity_score_chk 
        CHECK (severity_score IS NULL OR (severity_score BETWEEN 0 AND 10)),
    CONSTRAINT relation_to_med_chk
        CHECK (relation_to_med IS NULL OR relation_to_med IN ('before_medication','after_medication','unknown'))
);

CREATE TABLE symptom_medication_links (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom_entry_id    UUID NOT NULL REFERENCES symptom_entries(id) ON DELETE CASCADE,
    regimen_id          UUID NOT NULL REFERENCES medication_regimens(id) ON DELETE CASCADE,
    note                TEXT,
    UNIQUE (symptom_entry_id, regimen_id)
);

--------------------------------------------------
-- 6. NHẮC UỐNG & NOTIFICATION
--------------------------------------------------

CREATE TABLE push_devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_platform TEXT NOT NULL,   -- ios / android / web / other
    device_token    TEXT NOT NULL,
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_token)
);

ALTER TABLE push_devices
    ADD CONSTRAINT device_platform_chk
    CHECK (device_platform IN ('ios','android','web','other'));

CREATE TABLE notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id          UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    allow_push          BOOLEAN NOT NULL DEFAULT TRUE,
    allow_email         BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    timezone            TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, profile_id)
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id      UUID REFERENCES patient_profiles(id) ON DELETE SET NULL,
    type            TEXT NOT NULL,   -- medication_reminder / system / other
    payload         JSONB NOT NULL,
    scheduled_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'pending', -- pending / sent / failed / cancelled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notifications_type_chk
        CHECK (type IN ('medication_reminder','system','other')),
    CONSTRAINT notifications_status_chk
        CHECK (status IN ('pending','sent','failed','cancelled'))
);

--------------------------------------------------
-- 7. LEGAL & AUDIT
--------------------------------------------------

CREATE TABLE legal_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type        TEXT NOT NULL,   -- terms_of_use / privacy_policy / disclaimer / other
    version         TEXT NOT NULL,
    title           TEXT NOT NULL,
    content_url     TEXT,            -- link tới file/markdown
    effective_at    TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doc_type, version),
    CONSTRAINT legal_doc_type_chk
        CHECK (doc_type IN ('terms_of_use','privacy_policy','disclaimer','other'))
);

CREATE TABLE user_legal_acceptances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    legal_document_id   UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    accepted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address          TEXT,
    user_agent          TEXT,
    UNIQUE (user_id, legal_document_id)
);


--------------------------------------------------
-- 8. INDEX PHỤ TRỢ
--------------------------------------------------

CREATE INDEX idx_patient_profiles_owner ON patient_profiles(owner_user_id);
CREATE INDEX idx_profile_shares_user ON profile_shares(user_id);

CREATE INDEX idx_prescriptions_profile ON prescriptions(profile_id);
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

CREATE INDEX idx_med_regimens_profile ON medication_regimens(profile_id);
CREATE INDEX idx_med_regimens_prescription_item ON medication_regimens(prescription_item_id);

CREATE INDEX idx_med_intake_regimen ON medication_intake_events(regimen_id);
CREATE INDEX idx_med_intake_profile ON medication_intake_events(profile_id);

CREATE INDEX idx_symptoms_profile ON symptom_entries(profile_id);
CREATE INDEX idx_symptom_links_symptom ON symptom_medication_links(symptom_entry_id);
CREATE INDEX idx_symptom_links_regimen ON symptom_medication_links(regimen_id);

CREATE INDEX idx_push_devices_user ON push_devices(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_profile ON notifications(profile_id);


CREATE INDEX idx_interactions_sub1 ON drug_interactions(substance_id_1);
CREATE INDEX idx_interactions_sub2 ON drug_interactions(substance_id_2);
