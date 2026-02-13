// services/revenueCatService.ts
import { Capacitor } from "@capacitor/core";

// --- CONFIGURATION ---
// ANDROID (GOOGLE PLAY): Public API Key from RevenueCat (starts with 'goog_')
const GOOGLE_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;

// Entitlement ID configured in RevenueCat Dashboard -> Entitlements
const ENTITLEMENT_ID = "pro";

export interface Package {
  identifier: string; // RevenueCat package id (e.g. $rc_monthly)
  product: {
    identifier?: string; // Play product id (e.g. mode_pro_monthly) if exposed by plugin
    title: string;
    description: string;
    priceString: string;
  };
  packageType: string;
}

/**
 * Lazy-load the Capacitor Purchases module ONLY on native.
 * This prevents Vite/Web build from failing to resolve the native module.
 */
type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");

let rcModule: PurchasesModule | null = null;

async function getRCModule(): Promise<PurchasesModule | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (rcModule) return rcModule;

  rcModule = await import("@revenuecat/purchases-capacitor");
  return rcModule;
}

function unwrapCustomerInfo(result: any) {
  // Some versions return CustomerInfo directly; others wrap it.
  return result?.customerInfo ?? result;
}

class RevenueCatService {
  private static instance: RevenueCatService;

  private isInitialized = false;
  private currentUserId: string | null = null;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  public async initialize(userId: string) {
    if (!Capacitor.isNativePlatform()) {
      console.warn("⚠️ RevenueCat: Web platform detected. Native billing disabled.");
      return;
    }

    // Reconfigure if user changes (login/logout)
    if (this.isInitialized && this.currentUserId === userId) return;

    try {
      const mod = await getRCModule();
      if (!mod) return;

      const { Purchases, LOG_LEVEL } = mod;

      console.log("📱 RevenueCat: Initializing Native Mode...");
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      await Purchases.configure({
        apiKey: GOOGLE_API_KEY,
        appUserID: userId,
      });

      this.isInitialized = true;
      this.currentUserId = userId;

      console.log("✅ RevenueCat: Configured successfully for", userId);
    } catch (error) {
      console.error("❌ RevenueCat Init Error:", error);
    }
  }

  public async getOfferings(): Promise<Package[]> {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const mod = await getRCModule();
      if (!mod) return [];

      const { Purchases } = mod;

      console.log("🔄 RevenueCat: Fetching offerings...");
      const offerings: any = await Purchases.getOfferings();

      const pkgs: any[] = offerings?.current?.availablePackages ?? [];
      if (!pkgs.length) {
        console.warn("⚠️ RevenueCat: No offerings/packages found. Check Offerings + Products.");
        return [];
      }

      console.log(`✅ RevenueCat: Found ${pkgs.length} packages`);
      return pkgs.map((pkg: any) => ({
        identifier: pkg.identifier,
        product: {
          identifier: pkg.product?.identifier, // Play product id if available
          title: pkg.product?.title ?? "",
          description: pkg.product?.description ?? "",
          priceString: pkg.product?.priceString ?? "",
        },
        packageType: pkg.packageType,
      }));
    } catch (error) {
      console.error("❌ RevenueCat GetOfferings Error:", error);
      return [];
    }
  }

  public async checkProStatus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const mod = await getRCModule();
      if (!mod) return false;

      const { Purchases } = mod;

      const result: any = await Purchases.getCustomerInfo();
      const customerInfo = unwrapCustomerInfo(result);

      const isActive = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      console.log(`💎 RevenueCat: PRO Status (${ENTITLEMENT_ID}):`, isActive);

      return isActive;
    } catch (error) {
      console.error("❌ RevenueCat Status Check Error:", error);
      return false;
    }
  }

  public async restorePurchases(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const mod = await getRCModule();
      if (!mod) return false;

      const { Purchases } = mod;

      console.log("♻️ RevenueCat: Restoring purchases...");
      const result: any = await Purchases.restorePurchases();
      const customerInfo = unwrapCustomerInfo(result);

      const isActive = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      console.log(`✅ RevenueCat: Restore complete. Pro: ${isActive}`);

      return isActive;
    } catch (error) {
      console.error("❌ RevenueCat Restore Error:", error);
      return false;
    }
  }

  public async purchasePackage(packageIdentifier: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      alert("Billing is only available on Android/iOS devices.");
      return false;
    }

    try {
      const mod = await getRCModule();
      if (!mod) return false;

      const { Purchases } = mod;

      console.log("💸 RevenueCat: Purchasing:", packageIdentifier);

      const offerings: any = await Purchases.getOfferings();
      const pkgs: any[] = offerings?.current?.availablePackages ?? [];

      const pkg = pkgs.find(
        (p: any) =>
          p.identifier === packageIdentifier ||
          p.product?.identifier === packageIdentifier
      );

      if (!pkg) {
        console.error("❌ RevenueCat: Package not found in offerings:", packageIdentifier);
        return false;
      }

      const result: any = await Purchases.purchasePackage({ aPackage: pkg });
      const customerInfo = unwrapCustomerInfo(result);

      const isActive = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      console.log(`✅ RevenueCat: Purchase complete. Pro: ${isActive}`);

      return isActive;
    } catch (error: any) {
      if (error?.userCancelled) {
        console.log("⚠️ RevenueCat: User cancelled purchase");
        return false;
      }
      console.error("❌ RevenueCat Purchase Error:", error);
      return false;
    }
  }
}

export const revenueCat = RevenueCatService.getInstance();
