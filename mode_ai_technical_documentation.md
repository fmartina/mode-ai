# MODE AI – Technical Documentation

---

## 1. Overview

MODE AI is an AI-powered coaching application built with React and deployed as a native Android app using Capacitor. The app monetizes through Google Play subscriptions managed via RevenueCat.

This document describes the technical architecture, subscription implementation, and system design.

---

## 2. Tech Stack

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Capacitor (Android wrapper)

### Backend & Services
- Firebase Authentication
- Firestore (Lite SDK)
- Google Gemini 1.5 (AI engine)
- RevenueCat (Subscription management)
- Google Play Billing

---

## 3. System Architecture

### High-Level Flow

User → React UI → Firebase Auth  
                        ↓  
                 Firestore (sessions, plans)  
                        ↓  
                 Gemini API (AI responses)  
                        ↓  
     RevenueCat SDK → Google Play Billing  
                        ↓  
             Entitlement Validation ("pro")

---

## 4. Authentication Flow

1. User logs in via Google using Firebase Authentication.
2. If new user, a Firestore document is created.
3. RevenueCat is initialized using the Firebase UID as `appUserID`.

```ts
await Purchases.configure({
  apiKey: GOOGLE_API_KEY,
  appUserID: userId,
});
```

This ensures subscriptions are tied to authenticated users.

---

## 5. RevenueCat Implementation

### Platform Detection

Billing is enabled only on native platforms:

```ts
if (!Capacitor.isNativePlatform()) return;
```

This prevents billing logic from executing in web builds.

---

### Initialization

```ts
await Purchases.configure({
  apiKey: GOOGLE_API_KEY,
  appUserID: userId,
});
```

---

### Fetching Offerings

```ts
const offerings = await Purchases.getOfferings();
const packages = offerings.current.availablePackages;
```

---

### Purchase Flow

```ts
await Purchases.purchasePackage({ aPackage: pkg });
```

---

### Entitlement Validation

The app checks subscription status using the entitlement ID:

```ts
customerInfo.entitlements.active["pro"]
```

If active → MODE PRO features unlocked.

---

### Restore Purchases

```ts
await Purchases.restorePurchases();
```

Required for Google Play compliance.

---

## 6. Subscription Model

Two products configured in Google Play:

- `mode_pro_monthly`
- `mode_pro_annual`

Mapped inside RevenueCat Offering with entitlement:

- Entitlement ID: `pro`

RevenueCat handles:
- Receipt validation
- Subscription status sync
- Renewal tracking
- Cross-device consistency

---

## 7. Data Model

### Firestore Collections

- `users`
- `sessions`
- `draft_plans`
- `active_plans`
- `coaches`

Each session stores:
- Chat messages
- Milestones
- Coach metadata
- Activity timestamps

---

## 8. Android Configuration

- Capacitor Android project generated
- RevenueCat Capacitor plugin installed
- Android App Bundle signed for Play Console
- `capacitor.config.ts` includes Android API key
- Google Play Billing connected to RevenueCat

---

## 9. Security Model

- Firebase Authentication required
- Firestore rules enforce UID-based access
- RevenueCat performs server-side receipt validation
- Entitlement-based feature gating

---

## 10. Deployment Process

1. Build frontend with Vite
2. Sync with Capacitor
3. Generate Android App Bundle
4. Upload to Google Play Console
5. RevenueCat validates subscriptions

---

## 11. Scalability Considerations

- Stateless frontend architecture
- Server-validated billing
- Modular monetization service layer
- Entitlement-based feature control

---

## 12. Conclusion

MODE AI combines modern frontend architecture with native billing infrastructure. RevenueCat enables reliable subscription management while Firebase ensures secure authentication and persistent data storage.

The architecture is modular, scalable, and compliant with Google Play billing requirements.

