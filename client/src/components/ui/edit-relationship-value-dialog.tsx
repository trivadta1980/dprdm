"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

interface EditRelationshipValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relationshipValue: any
}

export function EditRelationshipValueDialog({
  open,
  onOpenChange,
  relationshipValue,
}: EditRelationshipValueDialogProps) {
  const { toast } = useToast()

  // Fetch attribute definitions for this relationship
  const { data: attributeDefinitions = [] } = useQuery({
    queryKey: [`/api/relationships/${relationshipValue?.relationshipId}/attribute-definitions`],
    enabled: !!relationshipValue?.relationshipId,
  })

  // Fetch current attribute values
  const { data: attributeValues = [] } = useQuery({
    queryKey: [`/api/relationships/values/${relationshipValue?.id}/attributes`],
    enabled: !!relationshipValue?.id,
  })

  const form = useForm({
    defaultValues: {
      attributes: attributeValues.reduce((acc: any, curr: any) => {
        acc[curr.definition.id] = curr.value
        return acc
      }, {}),
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      // Update attribute values
      const attributePromises = Object.entries(values.attributes).map(([definitionId, value]) => {
        const existingValue = attributeValues.find(
          (av: any) => av.definition.id === Number(definitionId)
        )

        if (existingValue) {
          return apiRequest(`/api/relationships/attribute-values/${existingValue.id}`, {
            method: "PATCH",
            body: JSON.stringify({ value }),
          })
        } else {
          return apiRequest(`/api/relationships/values/${relationshipValue.id}/attributes`, {
            method: "POST",
            body: JSON.stringify({
              attributeDefinitionId: Number(definitionId),
              value: String(value),
            }),
          })
        }
      })

      await Promise.all(attributePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] })
      toast({
        title: "Success",
        description: "Relationship value updated successfully.",
      })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relationship value",
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: any) {
    updateMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Relationship Value</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {attributeDefinitions.map((definition: any) => (
              <FormField
                key={definition.id}
                control={form.control}
                name={`attributes.${definition.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{definition.name}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
