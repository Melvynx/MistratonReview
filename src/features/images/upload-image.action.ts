"use server";

import { authAction, orgAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { fileAdapter } from "@/lib/files/vercel-blob-adapter";
import { z } from "zod";

const uploadImageSchema = z.object({
  formData: z.instanceof(FormData),
});

function extractAndValidateFile(formData: FormData): File {
  const files = formData.get("files") as File | File[] | null;

  if (!files) {
    throw new ActionError("No file provided");
  }

  const file = Array.isArray(files) ? files[0] : files;

  if (!(file instanceof File)) {
    throw new ActionError("Invalid file (not a file)");
  }

  if (!file.type.startsWith("image/")) {
    throw new ActionError("Invalid file (only images are allowed)");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new ActionError("File too large (max 2mb)");
  }

  return file;
}

export const uploadOrgImageAction = orgAction
  .metadata({})
  .inputSchema(uploadImageSchema)
  .action(async ({ parsedInput: { formData }, ctx: { org } }) => {
    const file = extractAndValidateFile(formData);

    const response = await fileAdapter.uploadFile({
      file,
      path: `orgs/${org.id}`,
    });

    if (response.error) {
      throw new ActionError(response.error.message);
    }

    return response.data.url;
  });

export const uploadUserImageAction = authAction
  .inputSchema(uploadImageSchema)
  .action(async ({ parsedInput: { formData }, ctx: { user } }) => {
    const file = extractAndValidateFile(formData);

    const response = await fileAdapter.uploadFile({
      file,
      path: `users/${user.id}`,
    });

    if (response.error) {
      throw new ActionError(response.error.message);
    }

    return response.data.url;
  });
