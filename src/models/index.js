const { sequelize } = require("../config/database");

const modelDefiners = [
  require("./role.model"),
  require("./user.model"),
  require("./patient-profile.model"),
  require("./profile-share.model"),
  require("./ref-source.model"),
  require("./substance.model"),
  require("./drug-product.model"),
  require("./product-substance.model"),
  require("./drug-interaction.model"),
  require("./prescription.model"),
  require("./prescription-item.model"),
  require("./prescription-file.model"),
  require("./medication-regimen.model"),
  require("./medication-intake-event.model"),
  require("./symptom-entry.model"),
  require("./symptom-medication-link.model"),
  require("./push-device.model"),
  require("./notification-preference.model"),
  require("./notification.model"),
  require("./legal-document.model"),
  require("./user-legal-acceptance.model"),
];

modelDefiners.forEach((defineModel) => defineModel(sequelize));

const {
  Role,
  User,
  PatientProfile,
  ProfileShare,
  RefSource,
  Substance,
  DrugProduct,
  ProductSubstance,
  DrugInteraction,
  Prescription,
  PrescriptionItem,
  PrescriptionFile,
  MedicationRegimen,
  MedicationIntakeEvent,
  SymptomEntry,
  SymptomMedicationLink,
  PushDevice,
  NotificationPreference,
  Notification,
  LegalDocument,
  UserLegalAcceptance,
} = sequelize.models;

const applyAssociations = () => {
  Role.hasMany(User, { foreignKey: "role_id", as: "users" });
  User.belongsTo(Role, { foreignKey: "role_id", as: "role" });

  User.hasMany(PatientProfile, {
    foreignKey: "owner_user_id",
    as: "ownedProfiles",
  });
  PatientProfile.belongsTo(User, { foreignKey: "owner_user_id", as: "owner" });

  PatientProfile.hasMany(ProfileShare, {
    foreignKey: "profile_id",
    as: "shares",
  });
  ProfileShare.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  User.hasMany(ProfileShare, { foreignKey: "user_id", as: "profileShares" });
  ProfileShare.belongsTo(User, { foreignKey: "user_id", as: "user" });

  RefSource.hasMany(Substance, { foreignKey: "source_id", as: "substances" });
  Substance.belongsTo(RefSource, { foreignKey: "source_id", as: "source" });
  RefSource.hasMany(DrugInteraction, {
    foreignKey: "source_id",
    as: "drugInteractions",
  });
  DrugInteraction.belongsTo(RefSource, {
    foreignKey: "source_id",
    as: "source",
  });

  DrugProduct.belongsToMany(Substance, {
    through: ProductSubstance,
    foreignKey: "product_id",
    otherKey: "substance_id",
    as: "substances",
  });
  Substance.belongsToMany(DrugProduct, {
    through: ProductSubstance,
    foreignKey: "substance_id",
    otherKey: "product_id",
    as: "drugProducts",
  });
  ProductSubstance.belongsTo(DrugProduct, {
    foreignKey: "product_id",
    as: "product",
  });
  ProductSubstance.belongsTo(Substance, {
    foreignKey: "substance_id",
    as: "substance",
  });

  Substance.hasMany(DrugInteraction, {
    foreignKey: "substance_id_1",
    as: "primaryDrugInteractions",
  });
  Substance.hasMany(DrugInteraction, {
    foreignKey: "substance_id_2",
    as: "secondaryDrugInteractions",
  });
  DrugInteraction.belongsTo(Substance, {
    foreignKey: "substance_id_1",
    as: "primarySubstance",
  });
  DrugInteraction.belongsTo(Substance, {
    foreignKey: "substance_id_2",
    as: "secondarySubstance",
  });

  PatientProfile.hasMany(Prescription, {
    foreignKey: "profile_id",
    as: "prescriptions",
  });
  Prescription.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  User.hasMany(Prescription, {
    foreignKey: "created_by_user_id",
    as: "createdPrescriptions",
  });
  Prescription.belongsTo(User, {
    foreignKey: "created_by_user_id",
    as: "creator",
  });

  Prescription.hasMany(PrescriptionItem, {
    foreignKey: "prescription_id",
    as: "items",
  });
  PrescriptionItem.belongsTo(Prescription, {
    foreignKey: "prescription_id",
    as: "prescription",
  });
  PrescriptionItem.belongsTo(DrugProduct, {
    foreignKey: "drug_product_id",
    as: "drugProduct",
  });
  PrescriptionItem.belongsTo(Substance, {
    foreignKey: "substance_id",
    as: "substance",
  });

  Prescription.hasMany(PrescriptionFile, {
    foreignKey: "prescription_id",
    as: "files",
  });
  PrescriptionFile.belongsTo(Prescription, {
    foreignKey: "prescription_id",
    as: "prescription",
  });

  PatientProfile.hasMany(MedicationRegimen, {
    foreignKey: "profile_id",
    as: "medicationRegimens",
  });
  MedicationRegimen.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  MedicationRegimen.belongsTo(PrescriptionItem, {
    foreignKey: "prescription_item_id",
    as: "prescriptionItem",
  });
  PrescriptionItem.hasMany(MedicationRegimen, {
    foreignKey: "prescription_item_id",
    as: "regimens",
  });
  MedicationRegimen.belongsTo(DrugProduct, {
    foreignKey: "drug_product_id",
    as: "drugProduct",
  });
  DrugProduct.hasMany(MedicationRegimen, {
    foreignKey: "drug_product_id",
    as: "medicationRegimens",
  });
  MedicationRegimen.belongsTo(User, {
    foreignKey: "created_by_user_id",
    as: "creator",
  });
  User.hasMany(MedicationRegimen, {
    foreignKey: "created_by_user_id",
    as: "createdRegimens",
  });

  MedicationRegimen.hasMany(MedicationIntakeEvent, {
    foreignKey: "regimen_id",
    as: "intakeEvents",
  });
  MedicationIntakeEvent.belongsTo(MedicationRegimen, {
    foreignKey: "regimen_id",
    as: "regimen",
  });
  PatientProfile.hasMany(MedicationIntakeEvent, {
    foreignKey: "profile_id",
    as: "medicationIntakeEvents",
  });
  MedicationIntakeEvent.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  User.hasMany(MedicationIntakeEvent, {
    foreignKey: "recorded_by_user_id",
    as: "recordedIntakeEvents",
  });
  MedicationIntakeEvent.belongsTo(User, {
    foreignKey: "recorded_by_user_id",
    as: "recorder",
  });

  PatientProfile.hasMany(SymptomEntry, {
    foreignKey: "profile_id",
    as: "symptomEntries",
  });
  SymptomEntry.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  User.hasMany(SymptomEntry, {
    foreignKey: "created_by_user_id",
    as: "createdSymptomEntries",
  });
  SymptomEntry.belongsTo(User, {
    foreignKey: "created_by_user_id",
    as: "creator",
  });

  SymptomEntry.belongsToMany(MedicationRegimen, {
    through: SymptomMedicationLink,
    foreignKey: "symptom_entry_id",
    otherKey: "regimen_id",
    as: "regimens",
  });
  MedicationRegimen.belongsToMany(SymptomEntry, {
    through: SymptomMedicationLink,
    foreignKey: "regimen_id",
    otherKey: "symptom_entry_id",
    as: "symptomEntries",
  });
  SymptomMedicationLink.belongsTo(SymptomEntry, {
    foreignKey: "symptom_entry_id",
    as: "symptomEntry",
  });
  SymptomMedicationLink.belongsTo(MedicationRegimen, {
    foreignKey: "regimen_id",
    as: "regimen",
  });

  User.hasMany(PushDevice, { foreignKey: "user_id", as: "pushDevices" });
  PushDevice.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(NotificationPreference, {
    foreignKey: "user_id",
    as: "notificationPreferences",
  });
  NotificationPreference.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  PatientProfile.hasMany(NotificationPreference, {
    foreignKey: "profile_id",
    as: "notificationPreferences",
  });
  NotificationPreference.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });

  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
  PatientProfile.hasMany(Notification, {
    foreignKey: "profile_id",
    as: "notifications",
  });
  Notification.belongsTo(PatientProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });

  LegalDocument.hasMany(UserLegalAcceptance, {
    foreignKey: "legal_document_id",
    as: "acceptances",
  });
  UserLegalAcceptance.belongsTo(LegalDocument, {
    foreignKey: "legal_document_id",
    as: "legalDocument",
  });
  User.hasMany(UserLegalAcceptance, {
    foreignKey: "user_id",
    as: "legalAcceptances",
  });
  UserLegalAcceptance.belongsTo(User, { foreignKey: "user_id", as: "user" });
};

applyAssociations();

module.exports = {
  sequelize,
  Role,
  User,
  PatientProfile,
  ProfileShare,
  RefSource,
  Substance,
  DrugProduct,
  ProductSubstance,
  DrugInteraction,
  Prescription,
  PrescriptionItem,
  PrescriptionFile,
  MedicationRegimen,
  MedicationIntakeEvent,
  SymptomEntry,
  SymptomMedicationLink,
  PushDevice,
  NotificationPreference,
  Notification,
  LegalDocument,
  UserLegalAcceptance,
};
