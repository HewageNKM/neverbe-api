import { BaseRepository } from "./BaseRepository";

/**
 * Website Repository - handles sliders, navigation, and site-wide configs
 */
export class WebsiteRepository extends BaseRepository<any> {
  constructor() {
    super("site_config");
  }

  /**
   * Get website sliders
   */
  async getSliders(): Promise<any[]> {
    const doc = await this.collection.doc("sliders").get();
    if (!doc.exists) return [];
    return doc.data()?.items || [];
  }

  /**
   * Get navigation configuration
   */
  async getNavigationConfig(): Promise<{
    mainNav: any[];
    footerNav: any[];
    socialLinks?: any[];
  }> {
    const doc = await this.collection.doc("navigation").get();
    if (!doc.exists) {
      return { mainNav: [], footerNav: [] };
    }
    return doc.data() as any;
  }
}

export const websiteRepository = new WebsiteRepository();
