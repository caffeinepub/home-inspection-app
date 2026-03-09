import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  Inspection,
  InspectionInput,
  Room,
  RoomInput,
  Defect,
  DefectInput,
  SubscriptionTier,
  StripeConfiguration,
  ShoppingItem,
  AIAnalysisResult,
} from '../backend';
import { useInternetIdentity } from './useInternetIdentity';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Inspection Queries
export function useGetInspectionsByInspector() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useQuery<Inspection[]>({
    queryKey: ['inspections', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      
      // Since backend doesn't have getInspectionsByInspector, we'll fetch from cache
      // The cache is populated when inspections are created or fetched individually
      const cachedInspections: Inspection[] = [];
      const cache = queryClient.getQueryCache();
      
      cache.getAll().forEach((query) => {
        if (query.queryKey[0] === 'inspection' && query.state.data) {
          const inspection = query.state.data as Inspection | null;
          if (inspection && inspection.inspectorId.toString() === identity.getPrincipal().toString()) {
            cachedInspections.push(inspection);
          }
        }
      });
      
      return cachedInspections;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetInspection(inspectionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Inspection | null>({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!actor || !inspectionId) return null;
      return actor.getInspection(inspectionId);
    },
    enabled: !!actor && !isFetching && !!inspectionId,
  });
}

export function useCreateInspection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InspectionInput): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      // Backend returns the inspection ID as Text
      const inspectionId = await actor.createInspection(input);
      return inspectionId;
    },
    onSuccess: async (inspectionId, variables) => {
      // Fetch the newly created inspection to populate the cache
      if (actor) {
        const newInspection = await actor.getInspection(inspectionId);
        if (newInspection) {
          // Set the inspection in cache
          queryClient.setQueryData(['inspection', inspectionId], newInspection);
        }
      }
      // Invalidate the inspections list to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

// Room Queries
export function useAddRoomToInspection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomInput: RoomInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addRoomToInspection(roomInput);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.inspectionId] });
    },
  });
}

export function useGetRoom(roomId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Room>({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!actor || !roomId) throw new Error('Room ID required');
      return actor.getRoom(roomId);
    },
    enabled: !!actor && !isFetching && !!roomId,
  });
}

// Photo Upload with AI Analysis and Caption
export function useUploadPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      roomId,
      inspectionId,
      description,
      onProgress,
    }: {
      file: File;
      roomId: string;
      inspectionId: string;
      description?: string;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');

      // Convert file to bytes
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      let externalBlob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        externalBlob = externalBlob.withUploadProgress(onProgress);
      }

      // Generate unique photo ID
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload photo to backend
      await actor.uploadPhoto(roomId, photoId, externalBlob);

      // Simulate AI analysis delay (2 seconds) for better UX
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call backend AI analysis
      const aiAnalysisResult = await actor.analyzePhoto(roomId, photoId);

      return {
        photoId,
        aiAnalysisResult,
        description,
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate inspection query to refresh rooms with new photo data
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.inspectionId] });
      // Also invalidate the specific room query if it exists
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
}

// Generate simulated AI caption (used for display purposes)
export function generateSimulatedAICaption(): string {
  const captions = [
    'Interior view showing wall and ceiling surfaces with visible moisture damage and discoloration patterns indicating potential water intrusion.',
    'Structural elements displaying hairline cracks and surface deterioration requiring further evaluation by qualified specialist.',
    'Electrical components with exposed wiring and improper installation presenting immediate safety concerns.',
    'Plumbing fixtures showing signs of leakage, corrosion, and water damage to surrounding materials.',
    'HVAC system components with visible wear, improper installation, and potential efficiency concerns.',
    'Foundation area exhibiting cracks, settling, and moisture intrusion requiring structural assessment.',
    'Roofing materials showing age-related deterioration, missing components, and potential leak points.',
    'Window and door assemblies with damaged seals, improper installation, and air infiltration issues.',
    'Flooring surfaces displaying water damage, structural concerns, and safety hazards from uneven surfaces.',
    'Bathroom area with mold growth, moisture damage, and ventilation deficiencies requiring remediation.',
  ];

  return captions[Math.floor(Math.random() * captions.length)];
}

// Defect Queries
export function useGetDefectsForRoom(roomId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Defect[]>({
    queryKey: ['defects', roomId],
    queryFn: async () => {
      if (!actor || !roomId) return [];
      return actor.getDefectsForRoom(roomId);
    },
    enabled: !!actor && !isFetching && !!roomId,
  });
}

export function useAddDefect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (defectInput: DefectInput) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have addDefect method, only updateDefect
      // We'll use updateDefect which should work for new defects too
      return actor.updateDefect(defectInput);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defects', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
}

export function useUpdateDefect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (defectInput: DefectInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDefect(defectInput);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defects', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
}

export function useDeleteDefect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, defectId }: { roomId: string; defectId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDefect(roomId, defectId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defects', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
}

// Summary and Statistics Queries
export function useGetOverallSummary(inspectionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['overallSummary', inspectionId],
    queryFn: async () => {
      if (!actor || !inspectionId) return '';
      // Backend doesn't have this method yet
      // Return a placeholder summary
      return 'Inspection summary will be available once the backend implements the getOverallSummary method.';
    },
    enabled: !!actor && !isFetching && !!inspectionId,
  });
}

export function useGetCountOfDefectsPerSeverity(inspectionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['defectsBySeverity', inspectionId],
    queryFn: async () => {
      if (!actor || !inspectionId) return [];
      // Backend doesn't have this method yet
      // Calculate from inspection data as a workaround
      const inspection = await actor.getInspection(inspectionId);
      if (!inspection) return [];
      
      const severityCounts = new Map<string, number>();
      
      // Count defects from all rooms
      inspection.rooms.forEach(room => {
        room.defects.forEach(defect => {
          const severity = defect.severity.toLowerCase();
          severityCounts.set(severity, (severityCounts.get(severity) || 0) + 1);
        });
      });
      
      // Convert to the expected format
      return Array.from(severityCounts.entries()).map(([severity, count]) => [severity, BigInt(count)]);
    },
    enabled: !!actor && !isFetching && !!inspectionId,
  });
}

// Stripe Queries
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]) => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      return JSON.parse(result) as { id: string; url: string };
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
