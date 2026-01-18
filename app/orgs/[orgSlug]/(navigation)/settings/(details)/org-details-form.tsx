"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import AvatarUpload from "@/features/images/avatar-upload";
import { uploadOrgImageAction } from "@/features/images/upload-image.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentOrg } from "@/hooks/use-current-org";
import {
  OrgDetailsFormSchema,
  type OrgDetailsFormSchemaType,
} from "../org.schema";

type ProductFormProps = {
  defaultValues: OrgDetailsFormSchemaType;
};

export const OrgDetailsForm = ({ defaultValues }: ProductFormProps) => {
  const router = useRouter();
  const org = useCurrentOrg();
  const mutation = useMutation({
    mutationFn: async (values: OrgDetailsFormSchemaType) => {
      if (!org?.id) {
        throw new Error("Organization ID is required");
      }

      return unwrapSafePromise(
        authClient.organization.update({
          data: {
            logo: values.logo ?? undefined,
            name: values.name,
          },
          organizationId: org.id,
        }),
      );
    },
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("files", file);
      return resolveActionResult(uploadOrgImageAction({ formData }));
    },
    onSuccess: (data) => {
      form.setFieldValue("logo", data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: OrgDetailsFormSchema,
    defaultValues,
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <Form form={form}>
      <div className="flex w-full flex-col gap-6 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
            <CardDescription>
              Add a custom image to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField name="logo">
              {(field) => (
                <field.Field>
                  <field.Content>
                    <AvatarUpload
                      onChange={(file) => uploadImageMutation.mutate(file)}
                      onRemove={() => field.setValue(null)}
                      initialFile={field.state.value ?? undefined}
                      isPending={uploadImageMutation.isPending}
                    />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Name</CardTitle>
            <CardDescription>
              Use your organization's name or your name if you don't have an
              organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField name="name">
              {(field) => (
                <field.Field>
                  <field.Content>
                    <field.Input placeholder="" />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
        </Card>
        <Card className="flex items-end p-6">
          <form.SubmitButton className="w-fit">Save</form.SubmitButton>
        </Card>
      </div>
    </Form>
  );
};
