"use client";

import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InlineTooltip } from "@/components/ui/tooltip";
import { LoadingButton } from "@/features/form/submit-button";
import { Form, useForm } from "@/features/form/tanstack-form";
import AvatarUpload from "@/features/images/avatar-upload";
import { uploadUserImageAction } from "@/features/images/upload-image.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import type { User } from "better-auth";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProfileFormType } from "./edit-profile.schema";
import { ProfileFormSchema } from "./edit-profile.schema";

type EditProfileFormProps = {
  defaultValues: User;
};

export const EditProfileCardForm = ({
  defaultValues,
}: EditProfileFormProps) => {
  const router = useRouter();

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormType) => {
      return unwrapSafePromise(
        authClient.updateUser({
          name: values.name ?? "",
          image: values.image,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Profile updated");
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

      return resolveActionResult(uploadUserImageAction({ formData }));
    },
    onSuccess: (data) => {
      form.setFieldValue("image", data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: ProfileFormSchema,
    defaultValues: {
      name: defaultValues.name,
      image: defaultValues.image ?? null,
    },
    onSubmit: async (values) => {
      await updateProfileMutation.mutateAsync(values);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      return unwrapSafePromise(
        authClient.sendVerificationEmail({
          email: defaultValues.email,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Verification email sent");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form form={form}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <form.AppField name="image">
              {(field) => (
                <AvatarUpload
                  onChange={(file) => uploadImageMutation.mutate(file)}
                  onRemove={() => field.setValue(null)}
                  initialFile={field.state.value ?? undefined}
                  isPending={uploadImageMutation.isPending}
                />
              )}
            </form.AppField>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Content>
                  <field.Input placeholder="" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-4">
              <span>Email</span>
              {defaultValues.emailVerified ? (
                <InlineTooltip title="Email verified. If you change your email, you will need to verify it again.">
                  <BadgeCheck size={16} />
                </InlineTooltip>
              ) : (
                <LoadingButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-testid="verify-email-button"
                  onClick={() => verifyEmailMutation.mutate()}
                  loading={verifyEmailMutation.isPending}
                >
                  Verify email
                </LoadingButton>
              )}
            </Label>
            <Typography>{defaultValues.email}</Typography>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Link
            className={buttonVariants({ size: "sm", variant: "link" })}
            href="/account/change-email"
          >
            Change email
          </Link>
          <Link
            className={buttonVariants({ size: "sm", variant: "link" })}
            href="/account/change-password"
          >
            Change password
          </Link>
          <div className="flex-1"></div>
          <form.SubmitButton>Save</form.SubmitButton>
        </CardFooter>
      </Card>
    </Form>
  );
};
