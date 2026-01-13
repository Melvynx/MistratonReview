"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient } from "@/lib/auth-client";
import { formatId } from "@/lib/format/id";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { NewOrganizationSchemaType } from "./new-org.schema";
import { CreateOrgSchema } from "./new-org.schema";

export const NewOrganizationForm = () => {
  const mutation = useMutation({
    mutationFn: async (values: NewOrganizationSchemaType) => {
      const result = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Organization created successfully");
      window.location.href = `/orgs/${result.data.slug}`;
    },
  });

  const form = useForm({
    schema: CreateOrgSchema,
    defaultValues: {
      name: "",
      slug: "",
    },
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <div className="flex w-full flex-col gap-6 lg:gap-8">
      <Card className="bg-card overflow-hidden">
        <Form form={form}>
          <CardContent className="flex flex-col gap-4 lg:gap-6">
            <form.AppField name="name">
              {(field) => (
                <field.Field>
                  <field.Label>Organization Name</field.Label>
                  <field.Content>
                    <field.Input
                      type="text"
                      className="input"
                      placeholder="Enter organization name"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.handleChange(value);
                        const formattedSlug = formatId(value);
                        form.setFieldValue("slug", formattedSlug);
                      }}
                    />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
            <form.AppField
              name="slug"
              asyncDebounceMs={300}
              validators={{
                onChangeAsync: async ({ value }) => {
                  if (!value) {
                    return undefined;
                  }

                  const { error } = await authClient.organization.checkSlug({
                    slug: value,
                  });

                  if (error) {
                    return "This organization ID is already taken";
                  }

                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.Field>
                  <field.Label>Organization Slug</field.Label>
                  <field.Content>
                    <field.Input
                      type="text"
                      className="input"
                      placeholder="Enter organization Slug"
                    />
                    <field.Description>
                      The organization ID is used to identify the organization,
                      it will be used in all the URLs.
                    </field.Description>
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
          <CardFooter className="border-border mt-6 flex justify-end border-t">
            <form.SubmitButton size="lg">Create organization</form.SubmitButton>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
};
