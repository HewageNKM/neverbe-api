export interface Title {
  name: string; // Brand title name, e.g., "Running Shoes"
  url: string; // URL to this specific title's page
}

export interface Type {
  name: string; // Type name, e.g., "Shoes"
  url: string; // URL to the type's main page under the manufacturer
  titles: Title[]; // Array of brand titles under this type
}
