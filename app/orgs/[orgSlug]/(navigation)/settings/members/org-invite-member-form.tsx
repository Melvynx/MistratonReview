"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient } from "@/lib/auth-client";
import type { AuthRole } from "@/lib/auth/auth-permissions";
import { RolesKeys } from "@/lib/auth/auth-permissions";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrentOrg } from "@/hooks/use-current-org";

const Schema = z.object({
  email: z.string().email(),
  role: z.string().default("member"),
});

type SchemaType = z.infer<typeof Schema>;

export const OrganizationInviteMemberForm = () => {
  const [open, setOpen] = useState(false);
  const activeOrg = useCurrentOrg();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: SchemaType) => {
      if (!activeOrg) {
        toast.error("No active organization");
        return;
      }

      const result = await authClient.organization.inviteMember({
        organizationId: activeOrg.id,
        email: values.email,
        role: values.role as AuthRole,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Invitation sent");
      setOpen(false);
      router.refresh();
    },
  });

  const form = useForm({
    schema: Schema,
    defaultValues: {
      email: "",
      role: "member",
    },
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button type="button">Invite</Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-md">
        <DialogHeader className="p-6">
          <div className="mt-4 flex justify-center">
            <Avatar className="size-16">
              {activeOrg?.image ? (
                <AvatarImage src={activeOrg.image} alt={activeOrg.name} />
              ) : null}
              <AvatarFallback>
                {activeOrg?.name.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <DialogTitle className="text-center">Invite Teammates</DialogTitle>

          <DialogDescription className="text-center">
            Invite members to collaborate in your organization
          </DialogDescription>
        </DialogHeader>

        <div className="border-t p-6">
          <Form form={form}>
            <div className="flex flex-col gap-8">
              <div className="flex items-end gap-4">
                <form.AppField name="email">
                  {(field) => (
                    <field.Field className="flex-2">
                      <field.Label>Email</field.Label>
                      <field.Content>
                        <field.Input
                          type="email"
                          placeholder="colleague@company.com"
                        />
                        <field.Message />
                      </field.Content>
                    </field.Field>
                  )}
                </form.AppField>

                <form.AppField name="role">
                  {(field) => (
                    <field.Field className="flex-1">
                      <field.Label>Role</field.Label>
                      <field.Content>
                        <field.Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {RolesKeys.filter((role) => role !== "owner").map(
                              (role) => (
                                <SelectItem
                                  key={role}
                                  value={role.toLowerCase()}
                                >
                                  {role.charAt(0).toUpperCase() +
                                    role.slice(1).toLowerCase()}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </field.Select>
                        <field.Message />
                      </field.Content>
                    </field.Field>
                  )}
                </form.AppField>
              </div>

              <form.SubmitButton className="w-full">
                Send invite
              </form.SubmitButton>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
