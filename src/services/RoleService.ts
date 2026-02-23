import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Role, Permission } from "@/model/Role";
import { AppError } from "@/utils/apiResponse";
import admin from "firebase-admin";

const COLLECTION_NAME = "roles";

export const getAllPermissions = (): Permission[] => {
  return [
    // System
    {
      key: "manage_roles",
      label: "Manage Roles & Permissions",
      group: "System",
    },

    // Dashboard
    { key: "view_dashboard", label: "View Dashboard", group: "Dashboard" },

    // Users
    { key: "view_users", label: "View Users", group: "Users" },
    { key: "create_users", label: "Create Users", group: "Users" },
    { key: "update_users", label: "Update Users", group: "Users" },
    { key: "delete_users", label: "Delete Users", group: "Users" },

    // Master Data
    {
      key: "view_master_data",
      label: "View Master Data",
      group: "Master Data",
    },
    {
      key: "create_master_data",
      label: "Create Master Data",
      group: "Master Data",
    },
    {
      key: "update_master_data",
      label: "Update Master Data",
      group: "Master Data",
    },
    {
      key: "delete_master_data",
      label: "Delete Master Data",
      group: "Master Data",
    },

    // Inventory - Stock Overview
    { key: "view_inventory", label: "View Stock Overview", group: "Inventory" },
    { key: "update_inventory", label: "Update Stock", group: "Inventory" },
    // Inventory - Adjustments
    { key: "view_adjustments", label: "View Adjustments", group: "Inventory" },
    {
      key: "create_adjustments",
      label: "Create Adjustments",
      group: "Inventory",
    },
    // Inventory - Suppliers
    { key: "view_suppliers", label: "View Suppliers", group: "Inventory" },
    { key: "create_suppliers", label: "Create Suppliers", group: "Inventory" },
    { key: "update_suppliers", label: "Update Suppliers", group: "Inventory" },
    { key: "delete_suppliers", label: "Delete Suppliers", group: "Inventory" },
    // Inventory - Purchase Orders
    {
      key: "view_purchase_orders",
      label: "View Purchase Orders",
      group: "Inventory",
    },
    {
      key: "create_purchase_orders",
      label: "Create Purchase Orders",
      group: "Inventory",
    },
    {
      key: "update_purchase_orders",
      label: "Update Purchase Orders",
      group: "Inventory",
    },
    // Inventory - GRN
    { key: "view_grn", label: "View Goods Received", group: "Inventory" },
    { key: "create_grn", label: "Create GRN", group: "Inventory" },

    // Orders
    { key: "view_orders", label: "View Orders", group: "Orders" },
    { key: "create_orders", label: "Create Orders", group: "Orders" },
    { key: "update_orders", label: "Update Orders", group: "Orders" },
    { key: "delete_orders", label: "Delete/Cancel Orders", group: "Orders" },

    // Finance - Dashboard
    { key: "view_finance", label: "View Finance Dashboard", group: "Finance" },
    // Finance - Petty Cash
    { key: "view_petty_cash", label: "View Petty Cash", group: "Finance" },
    {
      key: "create_petty_cash",
      label: "Create Petty Cash Entry",
      group: "Finance",
    },
    { key: "update_petty_cash", label: "Update Petty Cash", group: "Finance" },
    { key: "delete_petty_cash", label: "Delete Petty Cash", group: "Finance" },
    // Finance - Expense Categories
    {
      key: "view_expense_categories",
      label: "View Expense Categories",
      group: "Finance",
    },
    {
      key: "manage_expense_categories",
      label: "Manage Expense Categories",
      group: "Finance",
    },
    // Finance - Bank Accounts
    {
      key: "view_bank_accounts",
      label: "View Bank Accounts",
      group: "Finance",
    },
    {
      key: "manage_bank_accounts",
      label: "Manage Bank Accounts",
      group: "Finance",
    },
    // Finance - Supplier Invoices
    {
      key: "view_supplier_invoices",
      label: "View Supplier Invoices",
      group: "Finance",
    },
    {
      key: "create_supplier_invoices",
      label: "Create Supplier Invoices",
      group: "Finance",
    },
    {
      key: "update_supplier_invoices",
      label: "Update Supplier Invoices",
      group: "Finance",
    },

    // Campaign - Promotions
    { key: "view_promotions", label: "View Promotions", group: "Campaign" },
    { key: "create_promotions", label: "Create Promotions", group: "Campaign" },
    { key: "update_promotions", label: "Update Promotions", group: "Campaign" },
    { key: "delete_promotions", label: "Delete Promotions", group: "Campaign" },
    // Campaign - Coupons
    { key: "view_coupons", label: "View Coupons", group: "Campaign" },
    { key: "create_coupons", label: "Create Coupons", group: "Campaign" },
    { key: "update_coupons", label: "Update Coupons", group: "Campaign" },
    { key: "delete_coupons", label: "Delete Coupons", group: "Campaign" },
    // Campaign - Combos
    { key: "view_combos", label: "View Combos", group: "Campaign" },
    { key: "create_combos", label: "Create Combos", group: "Campaign" },
    { key: "update_combos", label: "Update Combos", group: "Campaign" },
    { key: "delete_combos", label: "Delete Combos", group: "Campaign" },

    // Website
    { key: "view_website", label: "View Website Manager", group: "Website" },
    {
      key: "update_website",
      label: "Update Website Content",
      group: "Website",
    },

    // Reports & Analytics
    { key: "view_reports", label: "View Reports", group: "Reports" },
    { key: "export_reports", label: "Export Reports", group: "Reports" },

    // Settings - General
    { key: "view_settings", label: "View Settings", group: "Settings" },
    { key: "update_settings", label: "Update ERP Settings", group: "Settings" },
    // Settings - Shipping
    { key: "view_shipping", label: "View Shipping Rates", group: "Settings" },
    {
      key: "update_shipping",
      label: "Update Shipping Rates",
      group: "Settings",
    },
    // Settings - Payment Methods
    {
      key: "view_payment_methods",
      label: "View Payment Methods",
      group: "Settings",
    },
    {
      key: "manage_payment_methods",
      label: "Manage Payment Methods",
      group: "Settings",
    },
    // Settings - Tax
    { key: "view_tax_settings", label: "View Tax Settings", group: "Settings" },
    {
      key: "update_tax_settings",
      label: "Update Tax Settings",
      group: "Settings",
    },

    // POS System
    { key: "access_pos", label: "Access POS System", group: "POS" },
    { key: "create_pos_orders", label: "Create POS Orders", group: "POS" },
    { key: "view_pos_orders", label: "View POS Orders", group: "POS" },
    { key: "manage_pos_cart", label: "Manage POS Cart", group: "POS" },
    { key: "view_pos_inventory", label: "View POS Inventory", group: "POS" },
    {
      key: "process_pos_exchange",
      label: "Process Item Exchanges",
      group: "POS",
    },
    { key: "view_pos_exchanges", label: "View Exchange History", group: "POS" },
  ];
};

export const createRole = async (
  role: Omit<Role, "createdAt" | "updatedAt">
): Promise<string> => {
  const roleRef = adminFirestore.collection(COLLECTION_NAME).doc(role.id);
  const doc = await roleRef.get();

  if (doc.exists) {
    throw new AppError(`Role with ID ${role.id} already exists`, 409);
  }

  const newRole: Role = {
    ...role,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await roleRef.set(newRole);
  return role.id;
};

export const updateRole = async (
  roleId: string,
  updates: Partial<Role>
): Promise<void> => {
  const roleRef = adminFirestore.collection(COLLECTION_NAME).doc(roleId);
  const doc = await roleRef.get();

  if (!doc.exists) {
    throw new AppError(`Role with ID ${roleId} not found`, 404);
  }

  await roleRef.update({
    ...updates,
    updatedAt: admin.firestore.Timestamp.now(),
  });
};

export const deleteRole = async (roleId: string): Promise<void> => {
  const roleRef = adminFirestore.collection(COLLECTION_NAME).doc(roleId);
  const doc = await roleRef.get();

  if (!doc.exists) {
    throw new AppError(`Role with ID ${roleId} not found`, 404);
  }

  const roleData = doc.data() as Role;
  if (roleData.isSystem) {
    throw new AppError("Cannot delete system role", 403);
  }

  await roleRef.delete();
};

export const getRole = async (roleId: string): Promise<Role | null> => {
  const doc = await adminFirestore
    .collection(COLLECTION_NAME)
    .doc(roleId)
    .get();
  if (!doc.exists) return null;
  return doc.data() as Role;
};

export const getAllRoles = async (): Promise<Role[]> => {
  const snapshot = await adminFirestore.collection(COLLECTION_NAME).get();
  return snapshot.docs.map((doc) => doc.data() as Role);
};
