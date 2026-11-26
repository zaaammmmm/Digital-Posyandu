# 04 — Data Dictionary (Logical Model)

> Ini adalah rancangan konseptual, bukan skema database final. Field dan retensi harus disesuaikan setelah validasi lapangan, penilaian privasi, dan konsultasi hukum/tenaga kesehatan.

## 1. Entitas inti

### `posyandu`
- `id` — UUID
- `name`
- `address_area` — alamat operasional minimum
- `village`, `district`, `regency`, `province`
- `service_schedule`
- `status`
- `created_at`, `updated_at`

### `user`
- `id`
- `full_name`
- `email_or_phone`
- `password_hash` / external identity reference
- `account_status`
- `last_login_at`
- `created_at`

### `membership`
- `id`
- `user_id`
- `posyandu_id`
- `role` — parent, cadre, health_worker, posyandu_admin, content_reviewer, system_admin
- `scope`
- `status`

### `child`
- `id`
- `posyandu_id`
- `registration_number` — internal identifier
- `full_name`
- `date_of_birth`
- `sex`
- `birth_weight` — optional, source recorded
- `record_status`
- `created_at`, `updated_at`

### `guardian`
- `id`
- `user_id`
- `full_name`
- `relationship`
- `contact`
- `created_at`

### `child_guardian`
- `child_id`
- `guardian_id`
- `relationship`
- `is_primary`
- `authorization_status`
- `consent_record_id`

### `visit`
- `id`
- `child_id`
- `posyandu_id`
- `visit_date`
- `activity_id`
- `recorded_by`
- `verification_status`
- `verified_by`
- `verified_at`
- `notes`
- `created_at`, `updated_at`

### `anthropometry_measurement`
- `id`
- `visit_id`
- `weight_kg`
- `length_height_cm`
- `measurement_type` — recumbent_length / standing_height
- `head_circumference_cm` — optional
- `muac_cm` — optional
- `measurement_device_or_method` — optional
- `measured_at`
- `recorded_by`
- `verification_status`
- `quality_flags` — array of flags, not diagnoses

### `growth_assessment`
- `id`
- `measurement_id`
- `indicator` — WAZ, LAZ/HAZ, WLZ/WHZ, etc.
- `z_score`
- `classification_code`
- `reference_standard`
- `reference_version`
- `calculation_engine_version`
- `calculated_at`
- `review_status`

**Important:** classification mapping and cut-offs must be taken from the applicable official technical guidance and independently validated. Do not infer classifications from an LLM.

### `immunization_event`
- `id`
- `child_id`
- `visit_id`
- `vaccine_code`
- `dose_sequence`
- `administration_date`
- `administered_by`
- `facility`
- `record_source`
- `verification_status`
- `notes`

### `immunization_schedule_rule`
- `id`
- `vaccine_code`
- `target_age_or_condition`
- `rule_description`
- `effective_from`
- `effective_until`
- `official_source`
- `source_document_version`
- `reviewed_by`
- `approved_at`
- `status`

### `supplement_event`
- `id`
- `child_id`
- `visit_id`
- `supplement_type`
- `administration_date`
- `recorded_by`
- `verification_status`
- `notes`
- Dose field only if required by an approved form and role.

### `development_screening`
- `id`
- `child_id`
- `visit_id`
- `instrument_name`
- `instrument_version`
- `screening_date`
- `result`
- `follow_up_action`
- `performed_by`
- `verification_status`

### `ai_summary`
- `id`
- `child_id`
- `visit_id`
- `input_record_version`
- `model_provider`
- `model_version`
- `prompt_version`
- `knowledge_source_ids`
- `generated_text`
- `safety_status`
- `generated_at`
- `review_status`

### `education_content`
- `id`
- `title`
- `topic`
- `body`
- `source_title`
- `source_url`
- `publisher`
- `published_at`
- `reviewed_by`
- `reviewed_at`
- `version`
- `status`

### `administrative_record`
- `id`
- `posyandu_id`
- `record_type` — guestbook, activity, cashbook, inventory, cadre_attendance, minutes, home_visit, aid_register
- `record_date`
- `title`
- `structured_payload`
- `attachment_refs`
- `created_by`
- `updated_by`
- `created_at`, `updated_at`

### `audit_log`
- `id`
- `actor_user_id`
- `action`
- `resource_type`
- `resource_id`
- `before_snapshot_ref`
- `after_snapshot_ref`
- `reason`
- `timestamp`
- `ip_or_device_metadata` — only if justified and disclosed

### `consent_record`
- `id`
- `guardian_id`
- `child_id`
- `purpose`
- `notice_version`
- `consent_status`
- `captured_at`
- `withdrawn_at`

## 2. Relasi utama
- Satu Posyandu memiliki banyak anggota, anak, kegiatan, dan catatan administrasi.
- Satu anak dapat memiliki satu atau lebih wali.
- Satu anak memiliki banyak kunjungan.
- Satu kunjungan memiliki pengukuran dan layanan.
- Satu pengukuran dapat memiliki beberapa hasil indikator pertumbuhan.
- Satu ringkasan AI mengacu pada versi catatan dan sumber edukasi tertentu.

## 3. Prinsip data
- Gunakan UUID/internal ID; jangan jadikan NIK sebagai primary key.
- Hindari mengumpulkan NIK, foto dokumen, atau lokasi presisi jika tidak diperlukan.
- Catat sumber data dan petugas pencatat.
- Pisahkan catatan asli dari hasil kalkulasi dan hasil AI.
- Simpan versi standar dan aturan.
- Jangan menghapus permanen histori klinis tanpa kebijakan retensi yang sah.
- Batasi isi log agar tidak merekam data kesehatan mentah secara berlebihan.
