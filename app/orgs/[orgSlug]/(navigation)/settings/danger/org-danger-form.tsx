"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient } from "@/lib/auth-client";
import { formatId } from "@/lib/format/id";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentOrg } from "@/hooks/use-current-org";
import type { OrgDangerFormSchemaType } from "../org.schema";
import { OrgDangerFormSchema } from "../org.schema";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";

type ProductFormProps = {
  defaultValues: OrgDangerFormSchemaType;
};

export const OrganizationDangerForm = ({ defaultValues }: ProductFormProps) => {
  const router = useRouter();
  const org = useCurrentOrg();

  const mutation = useMutation({
    mutationFn: async (values: OrgDangerFormSchemaType) => {
      if (!org?.id) {
        throw new Error("Organization ID is required");
      }
      return unwrapSafePromise(
        authClient.organization.update({
          data: {
            slug: values.slug,
          },
          organizationId: org.id,
        }),
      );
    },
    onSuccess: (data) => {
      const newUrl = window.location.href.replace(
        `/orgs/${defaultValues.slug}/`,
        `/orgs/${data.slug}/`,
      );
      router.push(newUrl);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: OrgDangerFormSchema,
    defaultValues,
    onSubmit: async (values) => {
      dialogManager.confirm({
        title: "Are you sure ?",
        description:
          "You are about to change the unique identifier of your organization. All the previous URLs will be changed.",
        action: {
          label: "Yes, change the slug",
          onClick: () => {
            mutation.mutate(values);
          },
        },
      });
    },
  });

  return (
    <Form form={form}>
      <div className="flex w-full flex-col gap-6 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Slug</CardTitle>
            <CardDescription>
              Slug is the unique identifier of your organization. It's used in
              all the URLs, if you change it, all your URLs will be broken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField name="slug">
              {(field) => (
                <field.Field>
                  <field.Content>
                    <field.Input
                      type="text"
                      placeholder=""
                      onChange={(e) => {
                        const slug = formatId(e.target.value);
                        field.handleChange(slug);
                      }}
                    />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
          <CardFooter className="border-tu flex justify-end">
            <form.SubmitButton>Save</form.SubmitButton>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
};
