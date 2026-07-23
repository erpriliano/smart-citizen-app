import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { SessionContext, SignInInput } from '@smart-citizen/identity-contracts';

import { useIdentityClient } from './identity-provider';

export const sessionQueryKey = ['identity', 'session'] as const;

export function useSessionQuery(): UseQueryResult<SessionContext, Error> {
  const client = useIdentityClient();

  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => client.getSession(signal),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignInMutation(): UseMutationResult<SessionContext, Error, SignInInput> {
  const client = useIdentityClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => client.signIn(input),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useSignOutMutation(): UseMutationResult<void, Error, void> {
  const client = useIdentityClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.signOut(),
    onSettled: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries();
    },
  });
}
