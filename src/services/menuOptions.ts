/**
 * Menu Options Service
 * Handles option group and option value CRUD, plus attach/detach to menu items
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  OptionGroup,
  OptionValue,
  OptionGroupCreateRequest,
  OptionGroupUpdateRequest,
  OptionValueCreateRequest,
  OptionValueUpdateRequest,
  MenuItemOptionGroupAttachRequest,
  MenuItemOptionGroupAttachResponse,
  MessageResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

// ============================================================================
// Option Group Operations
// ============================================================================

export const getOptionGroups = async (restaurantId: number): Promise<OptionGroup[]> => {
  const response = await api.get<OptionGroup[]>(ENDPOINTS.MENU_OPTIONS.GROUPS_LIST(restaurantId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch option groups"));
  }

  return response.data;
};

export const getOptionGroup = async (groupId: number): Promise<OptionGroup> => {
  const response = await api.get<OptionGroup>(ENDPOINTS.MENU_OPTIONS.GROUP_GET(groupId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch option group"));
  }

  return response.data;
};

export const createOptionGroup = async (
  restaurantId: number,
  data: OptionGroupCreateRequest
): Promise<OptionGroup> => {
  const response = await api.post<OptionGroup>(
    ENDPOINTS.MENU_OPTIONS.GROUPS_CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create option group"));
  }

  return response.data;
};

export const updateOptionGroup = async (
  groupId: number,
  data: OptionGroupUpdateRequest
): Promise<OptionGroup> => {
  const response = await api.put<OptionGroup>(ENDPOINTS.MENU_OPTIONS.GROUP_UPDATE(groupId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update option group"));
  }

  return response.data;
};

export const deleteOptionGroup = async (groupId: number): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.MENU_OPTIONS.GROUP_DELETE(groupId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete option group"));
  }

  return response.data;
};

// ============================================================================
// Option Value Operations
// ============================================================================

export const createOptionValue = async (
  groupId: number,
  data: OptionValueCreateRequest
): Promise<OptionValue> => {
  const response = await api.post<OptionValue>(ENDPOINTS.MENU_OPTIONS.VALUE_CREATE(groupId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create option value"));
  }

  return response.data;
};

export const updateOptionValue = async (
  valueId: number,
  data: OptionValueUpdateRequest
): Promise<OptionValue> => {
  const response = await api.put<OptionValue>(ENDPOINTS.MENU_OPTIONS.VALUE_UPDATE(valueId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update option value"));
  }

  return response.data;
};

export const deleteOptionValue = async (valueId: number): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.MENU_OPTIONS.VALUE_DELETE(valueId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete option value"));
  }

  return response.data;
};

// ============================================================================
// Attach / Detach Option Groups to Menu Items
// ============================================================================

export const attachOptionGroupToItem = async (
  menuId: number,
  data: MenuItemOptionGroupAttachRequest
): Promise<MenuItemOptionGroupAttachResponse> => {
  const response = await api.post<MenuItemOptionGroupAttachResponse>(
    ENDPOINTS.MENU_OPTIONS.ITEM_ATTACH_GROUP(menuId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to attach option group"));
  }

  return response.data;
};

export const detachOptionGroupFromItem = async (
  menuId: number,
  groupId: number
): Promise<MenuItemOptionGroupAttachResponse> => {
  const response = await api.delete<MenuItemOptionGroupAttachResponse>(
    ENDPOINTS.MENU_OPTIONS.ITEM_DETACH_GROUP(menuId, groupId)
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to detach option group"));
  }

  return response.data;
};
