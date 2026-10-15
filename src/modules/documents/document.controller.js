import * as documentService from "./document.service.js";

export async function uploadDocument(req, res) {
  const document = await documentService.uploadDocument(
    req.user.id,
    req.file,
    req.body.documentType,
  );

  return res.status(201).json({
    success: true,
    data: document,
    message: "Document uploaded successfully",
  });
}

export async function getDocuments(req, res) {
  const documents = await documentService.getDocuments(req.user.id);

  return res.status(200).json({
    success: true,
    data: documents,
    message: "Documents retrieved successfully",
  });
}

export async function getDocumentDownloadUrl(req, res) {
  const result = await documentService.getDocumentDownloadUrl(
    req.user.id,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Download link generated successfully",
  });
}

export async function deleteDocument(req, res) {
  await documentService.deleteDocument(req.user.id, req.params.id);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Document deleted successfully",
  });
}
