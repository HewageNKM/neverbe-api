import { settingsRepository } from "@/repositories/SettingsRepositories";

/**
 * SettingService - Business logic for app settings
 * Delegates data access to settingsRepository
 */

export const getERPSettings = async () => {
  return await settingsRepository.getErpSettings();
};

export const updateERPSettings = async (data: any) => {
  await settingsRepository.updateErpSettings(data);
  return { success: true };
};
