export type SubCategory = string;

export interface Category {
  name: string;
  subCategories: SubCategory[];
}

export const EXPENSE_CATEGORIES: Category[] = [
  {
    name: "Office Supplies",
    subCategories: [
      "Stationery",
      "Printer Ink/Toner",
      "Cleaning Supplies",
      "Refreshments",
      "Other",
    ],
  },
  {
    name: "Travel & Transport",
    subCategories: [
      "Fuel",
      "Parking",
      "Public Transport",
      "Taxi/Ride-share",
      "Vehicle Maintenance",
      "Other",
    ],
  },
  {
    name: "Utilities",
    subCategories: [
      "Electricity",
      "Water",
      "Internet",
      "Phone",
      "Gas",
      "Other",
    ],
  },
  {
    name: "Maintenance & Repairs",
    subCategories: [
      "Equipment Repair",
      "Building Maintenance",
      "Plumbing",
      "Electrical",
      "Other",
    ],
  },
  {
    name: "Marketing & Advertising",
    subCategories: [
      "Social Media Ads",
      "Print",
      "Events",
      "Promotional Materials",
      "Other",
    ],
  },
  {
    name: "Food",
    subCategories: [
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snacks",
      "Drinks",
      "Other",
    ],
  },
  {
    name: "Meals & Entertainment",
    subCategories: ["Client Meetings", "Staff Welfare", "Team Events", "Other"],
  },
  {
    name: "Miscellaneous",
    subCategories: ["Other"],
  },
];
