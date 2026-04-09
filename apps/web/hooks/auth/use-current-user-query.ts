'use client';

import { useQuery } from '@tanstack/react-query';
import {
  buildCurrentUserQueryOptions,
  type UseCurrentUserQueryOptions,
} from './current-user-query-options';

export function useCurrentUserQuery(options?: UseCurrentUserQueryOptions) {
  return useQuery(buildCurrentUserQueryOptions(options));
}
