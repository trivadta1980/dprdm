import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, UserX, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Role, 
  InsertUser, 
  UpdateUser,
  insertUserSchema, 
  updateUserSchema 
} from "@shared/schema";

export default function ManageUsersPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Create form
  const createForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      roleId: undefined
    }
  });

  // Edit form
  const editForm = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      roleId: undefined
    }
  });

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      console.log('Fetching users...');
      const res = await apiRequest("GET", "/api/users");
      const data = await res.json();
      console.log('Users fetched:', data);
      return data;
    }
  });

  // Fetch roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      console.log('Fetching roles...');
      const res = await apiRequest("GET", "/api/roles");
      const data = await res.json();
      console.log('Roles fetched:', data);
      return data;
    }
  });

  // Create mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      console.log('Creating user with data:', data);
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.json();
        console.error('Create user error:', error);
        throw new Error(error.message || "Failed to create user");
      }
      const result = await res.json();
      console.log('Create user response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "User created successfully"
      });
    },
    onError: (error: Error) => {
      console.error('Create mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUser }) => {
      console.log('Updating user:', id, 'with data:', data);
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        console.error('Update user error:', error);
        throw new Error(error.message || "Failed to update user");
      }
      const result = await res.json();
      console.log('Update user response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    },
    onError: (error: Error) => {
      console.error('Update mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting user:', id);
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      if (!res.ok) {
        const error = await res.json();
        console.error('Delete user error:', error);
        throw new Error(error.message || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const handleCreateSubmit = (data: InsertUser) => {
    console.log('Create form submitted with data:', data);
    createUserMutation.mutate({
      ...data,
      password: "password123",
      confirmPassword: "password123"
    });
  };

  const handleEditSubmit = (data: UpdateUser) => {
    if (!editingUser) {
      console.error('No user selected for editing');
      return;
    }

    console.log('Edit form submitted with data:', data);
    toast({
      title: "Processing Update",
      description: "Attempting to update user..."
    });

    updateUserMutation.mutate({
      id: editingUser.id,
      data: {
        ...data,
        username: editingUser.username
      }
    });
  };

  const handleEditClick = (user: User) => {
    console.log('Edit clicked for user:', user);
    setEditingUser(user);
    editForm.reset({
      email: user.email,
      roleId: user.roleId
    });
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>

          {/* Create User Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Create form submission triggered');
                    createForm.handleSubmit(handleCreateSubmit)(e);
                  }} 
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            console.log('Role selected:', value);
                            field.onChange(Number(value));
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createUserMutation.isPending}
                    onClick={() => console.log('Create button clicked')}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roles?.find((r) => r.id === user.roleId)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                        disabled={user.id === 1}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending || user.id === 1}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log('Edit form submission triggered');
                  editForm.handleSubmit(handleEditSubmit)(e);
                }} 
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          console.log('Role selected for edit:', value);
                          field.onChange(Number(value));
                        }}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles?.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateUserMutation.isPending}
                  onClick={() => console.log('Update button clicked')}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}