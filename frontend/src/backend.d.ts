import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface InspectionPhoto {
    id: string;
    externalBlob: ExternalBlob;
    annotations: Array<Annotation>;
    aiAnalysisResults: Array<AIAnalysisResult>;
    aiCaption?: string;
    defectDescription?: string;
}
export interface Address {
    zip: string;
    street: string;
    city: string;
    state: string;
}
export interface InspectionInput {
    tier: SubscriptionTier;
    inspectorId: Principal;
    propertyDetails?: PropertyDetails;
    address: Address;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Inspection {
    id: string;
    startTime: Time;
    status: InspectionStatus;
    endTime?: Time;
    subscriptionTier: SubscriptionTier;
    inspectorId: Principal;
    propertyDetails?: PropertyDetails;
    summary: string;
    address: Address;
    aiAnalysisOngoing: boolean;
    rooms: Array<Room>;
}
export interface DefectInput {
    defect: Defect;
    roomId: string;
}
export interface Room {
    id: string;
    name: string;
    defects: Array<Defect>;
    photos: Array<InspectionPhoto>;
}
export interface Annotation {
    id: bigint;
    color: string;
    text?: string;
    timestamp: bigint;
    annotationType: string;
    coordinates: Array<bigint>;
}
export interface PropertyDetails {
    bedrooms: bigint;
    squareFootage: bigint;
    bathrooms: bigint;
    yearBuilt: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Defect {
    id: string;
    recommendations: Array<string | null>;
    description: string;
    severity: string;
    imageId: string;
}
export interface AIAnalysisResult {
    defectType: string;
    description: string;
    severityRating: string;
    confidence: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface RoomInput {
    roomId: string;
    inspectionId: string;
    roomName: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    contactInfo: string;
    name: string;
    email: string;
    companyLogo?: string;
    companyName: string;
}
export enum InspectionStatus {
    completed = "completed",
    draft = "draft",
    inProgress = "inProgress",
    reportGenerated = "reportGenerated"
}
export enum SubscriptionTier {
    premium = "premium",
    free = "free"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addRoomToInspection(roomInput: RoomInput): Promise<void>;
    analyzePhoto(roomId: string, photoId: string): Promise<AIAnalysisResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createInspection(input: InspectionInput): Promise<string>;
    deleteDefect(roomId: string, defectId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDefectsForRoom(roomId: string): Promise<Array<Defect>>;
    getInspection(inspectionId: string): Promise<Inspection | null>;
    getPropertyDetails(inspectionId: string): Promise<PropertyDetails | null>;
    getRoom(roomId: string): Promise<Room>;
    getRoomsWithPhotos(inspectionId: string): Promise<Array<Room>>;
    getRoomsWithoutPhotos(inspectionId: string): Promise<Array<Room>>;
    getStats(): Promise<Array<[string, bigint]>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateDefect(defectInput: DefectInput): Promise<void>;
    uploadPhoto(roomId: string, photoId: string, blob: ExternalBlob): Promise<void>;
}
