import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useSession() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
