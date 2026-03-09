import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";


import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";


actor {
  include MixinStorage();

  type InspectionStatus = { #draft; #inProgress; #completed; #reportGenerated };
  type SubscriptionTier = { #free; #premium };
  type Defect = {
    id : Text;
    description : Text;
    severity : Text;
    imageId : Text;
    recommendations : [?Text];
  };
  type Annotation = {
    id : Nat;
    annotationType : Text;
    coordinates : [Int];
    color : Text;
    text : ?Text;
    timestamp : Int;
  };
  type Address = { street : Text; city : Text; state : Text; zip : Text };
  public type AIAnalysisResult = {
    defectType : Text;
    confidence : Text;
    description : Text;
    severityRating : Text;
  };
  public type InspectionPhoto = {
    id : Text;
    externalBlob : Storage.ExternalBlob;
    annotations : [Annotation];
    defectDescription : ?Text;
    aiAnalysisResults : [AIAnalysisResult];
    aiCaption : ?Text;
  };
  type Room = {
    id : Text;
    name : Text;
    photos : [InspectionPhoto];
    defects : [Defect];
  };
  type PropertyDetails = {
    bedrooms : Nat;
    bathrooms : Nat;
    squareFootage : Nat;
    yearBuilt : Nat;
  };
  type Inspection = {
    id : Text;
    inspectorId : Principal;
    address : Address;
    rooms : [Room];
    status : InspectionStatus;
    startTime : Time.Time;
    endTime : ?Time.Time;
    subscriptionTier : SubscriptionTier;
    summary : Text;
    aiAnalysisOngoing : Bool;
    propertyDetails : ?PropertyDetails;
  };
  module Inspection {
    public func compare(inspection1 : Inspection, inspection2 : Inspection) : Order.Order {
      Text.compare(inspection1.id, inspection2.id);
    };
  };
  public type InspectionInput = {
    inspectorId : Principal;
    address : Address;
    tier : SubscriptionTier;
    propertyDetails : ?PropertyDetails;
  };
  public type RoomInput = {
    inspectionId : Text;
    roomId : Text;
    roomName : Text;
  };
  public type DefectInput = { roomId : Text; defect : Defect };
  public type UserProfile = {
    name : Text;
    email : Text;
    companyName : Text;
    companyLogo : ?Text;
    contactInfo : Text;
  };

  let inspections = Map.empty<Text, Inspection>();
  let rooms = Map.empty<Text, Room>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let stats = Map.empty<Text, Nat>();
  let inspectionOwners = Map.empty<Text, Principal>();
  let roomToInspection = Map.empty<Text, Text>();
  let stripeSessionOwners = Map.empty<Text, Principal>();

  var stripeConfig : ?Stripe.StripeConfiguration = null;
  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getStats() : async [(Text, Nat)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view stats");
    };
    stats.toArray();
  };

  func getInspectionInternal(id : Text) : ?Inspection {
    inspections.get(id);
  };

  func getInspectionInternalOrTrap(id : Text) : Inspection {
    switch (inspections.get(id)) {
      case (null) { Runtime.trap("Inspection with id: " # id # " does not exist. ") };
      case (?inspection) { inspection };
    };
  };

  func getRoomInternal(id : Text) : ?Room {
    rooms.get(id);
  };

  func getRoomInternalOrTrap(id : Text) : Room {
    switch (rooms.get(id)) {
      case (null) { Runtime.trap("Room with id: " # id # " does not exist. ") };
      case (?room) { room };
    };
  };

  func verifyInspectionOwnership(caller : Principal, inspectionId : Text) {
    switch (inspectionOwners.get(inspectionId)) {
      case (null) { Runtime.trap("Inspection not found") };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only modify your own inspections");
        };
      };
    };
  };

  func verifyRoomOwnership(caller : Principal, roomId : Text) {
    switch (roomToInspection.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?inspectionId) {
        verifyInspectionOwnership(caller, inspectionId);
      };
    };
  };

  func verifyStripeSessionOwnership(caller : Principal, sessionId : Text) {
    switch (stripeSessionOwners.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only access your own payment sessions");
        };
      };
    };
  };

  public shared ({ caller }) func uploadPhoto(roomId : Text, photoId : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload photos");
    };
    verifyRoomOwnership(caller, roomId);

    let updatedRoom = switch (rooms.get(roomId)) {
      case (null) {
        let newRoom : Room = { id = roomId; name = "Unknown"; photos = []; defects = [] };
        newRoom;
      };
      case (?room) { room };
    };

    let newPhoto : InspectionPhoto = {
      id = photoId;
      externalBlob = blob;
      annotations = [];
      defectDescription = null;
      aiAnalysisResults = [];
      aiCaption = null;
    };

    let updatedPhotos = updatedRoom.photos.concat([newPhoto]);
    let finalRoom = { id = updatedRoom.id; name = updatedRoom.name; photos = updatedPhotos; defects = updatedRoom.defects };
    rooms.add(roomId, finalRoom);
  };

  public shared ({ caller }) func analyzePhoto(roomId : Text, photoId : Text) : async AIAnalysisResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can analyze photos");
    };
    verifyRoomOwnership(caller, roomId);

    let dummyResult : AIAnalysisResult = {
      defectType = "Crack";
      confidence = "97%";
      description = "A crack is likely present in the wall.";
      severityRating = "critical";
    };

    let room = getRoomInternalOrTrap(roomId);
    let updatedPhotos = room.photos.map(
      func(photo) {
        if (photo.id == photoId) {
          {
            photo with
            aiAnalysisResults = [dummyResult];
            aiCaption = ?"Detected crack in wall";
          };
        } else { photo };
      }
    );

    let updatedRoom = { room with photos = updatedPhotos };
    rooms.add(roomId, updatedRoom);
    dummyResult;
  };

  public query ({ caller }) func getRoom(roomId : Text) : async Room {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rooms");
    };
    verifyRoomOwnership(caller, roomId);
    getRoomInternalOrTrap(roomId);
  };

  public query ({ caller }) func getInspection(inspectionId : Text) : async ?Inspection {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inspections");
    };
    let inspection = inspections.get(inspectionId);
    switch (inspection) {
      case (null) { null };
      case (?insp) {
        if (insp.inspectorId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only view your own inspections");
        };
        inspection;
      };
    };
  };

  public shared ({ caller }) func createInspection(input : InspectionInput) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create inspections");
    };
    if (input.inspectorId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only create inspections for yourself");
    };
    let inspection : Inspection = {
      id = Time.now().toText();
      inspectorId = input.inspectorId;
      address = input.address;
      status = #draft;
      startTime = Time.now();
      endTime = null;
      rooms = [];
      subscriptionTier = input.tier;
      summary = "";
      aiAnalysisOngoing = false;
      propertyDetails = input.propertyDetails;
    };
    inspections.add(inspection.id, inspection);
    inspectionOwners.add(inspection.id, input.inspectorId);
    inspection.id;
  };

  public query ({ caller }) func getPropertyDetails(inspectionId : Text) : async ?PropertyDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view property details");
    };
    verifyInspectionOwnership(caller, inspectionId);
    switch (inspections.get(inspectionId)) {
      case (null) { null };
      case (?inspection) { inspection.propertyDetails };
    };
  };

  public shared ({ caller }) func addRoomToInspection(roomInput : RoomInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add rooms");
    };
    verifyInspectionOwnership(caller, roomInput.inspectionId);
    let inspection = getInspectionInternalOrTrap(roomInput.inspectionId);
    let room : Room = { id = roomInput.roomId; name = roomInput.roomName; photos = []; defects = [] };
    let updatedRooms = inspection.rooms.concat([room]);
    let updatedInspection : Inspection = {
      id = inspection.id;
      inspectorId = inspection.inspectorId;
      address = inspection.address;
      status = inspection.status;
      startTime = inspection.startTime;
      endTime = inspection.endTime;
      rooms = updatedRooms;
      subscriptionTier = inspection.subscriptionTier;
      summary = inspection.summary;
      aiAnalysisOngoing = false;
      propertyDetails = inspection.propertyDetails;
    };
    inspections.add(inspection.id, updatedInspection);
    roomToInspection.add(roomInput.roomId, roomInput.inspectionId);
  };

  public query ({ caller }) func getRoomsWithPhotos(inspectionId : Text) : async [Room] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rooms");
    };
    verifyInspectionOwnership(caller, inspectionId);
    let inspection = getInspectionInternalOrTrap(inspectionId);
    let roomsWithPhotos = inspection.rooms.filter(func(room) { room.photos.size() > 0 });
    roomsWithPhotos;
  };

  public query ({ caller }) func getRoomsWithoutPhotos(inspectionId : Text) : async [Room] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rooms");
    };
    verifyInspectionOwnership(caller, inspectionId);
    let inspection = getInspectionInternalOrTrap(inspectionId);
    let roomsWithoutPhotos = inspection.rooms.filter(func(room) { room.photos.size() == 0 });
    roomsWithoutPhotos;
  };

  public shared ({ caller }) func deleteDefect(roomId : Text, defectId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete defects");
    };
    verifyRoomOwnership(caller, roomId);
    let room = getRoomInternalOrTrap(roomId);
    let updatedDefects = room.defects.filter(func(d) { d.id != defectId });
    let updatedRoom = { id = room.id; name = room.name; photos = room.photos; defects = updatedDefects };
    rooms.add(updatedRoom.id, updatedRoom);
  };

  public shared ({ caller }) func updateDefect(defectInput : DefectInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update defects");
    };
    verifyRoomOwnership(caller, defectInput.roomId);
    let room = getRoomInternalOrTrap(defectInput.roomId);
    let updatedDefects = room.defects.map(func(d) { if (d.id == defectInput.defect.id) { defectInput.defect } else { d } });
    let updatedRoom = { id = room.id; name = room.name; photos = room.photos; defects = updatedDefects };
    rooms.add(updatedRoom.id, updatedRoom);
  };

  public query ({ caller }) func getDefectsForRoom(roomId : Text) : async [Defect] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view defects");
    };
    verifyRoomOwnership(caller, roomId);
    let room = getRoomInternalOrTrap(roomId);
    room.defects;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    switch (stripeConfig) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set stripe configuration");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    verifyStripeSessionOwnership(caller, sessionId);
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    let sessionId = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    stripeSessionOwners.add(sessionId, caller);
    sessionId;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
